# Architectural Decisions

This file documents architectural and process decisions made during development.

Format: Date | Decision | Reason

---

## Initial Decisions (from Control Tower)

**2024-12-XX | Project Type: Sheets-Backed App | Rapid MVP with simple data storage**

Decision: This project uses the Sheets-Backed App project type, using Google Sheets as the backend data store.

Reason: 
- MVP needs to ship quickly without database setup
- Simple CRUD operations (add clients, input workouts, view data)
- Non-technical user (trainer) can edit data directly in sheets if needed
- Data structure is simple (rows/columns) - clients and workouts
- Low to medium data volume expected (< 100 clients, < 1000 workouts)

**2024-12-XX | Single-Page Application | Simplicity for non-technical user**

Decision: All functionality accessible on a single page with no navigation or routing.

Reason:
- User requested single-page for simplicity
- Reduces complexity for non-technical trainer
- Faster interactions (no page reloads)
- Cleaner user experience for MVP

**2024-12-XX | Web Application Platform | Browser-based access**

Decision: Application will be a web application accessible via browser URL.

Reason:
- No installation required
- Accessible from any device with browser
- Easier deployment and updates
- Matches user's platform preference

**2024-12-XX | Google Sheets as Backend | Simple CRUD operations**

Decision: Use Google Sheets API for all data storage (clients and workouts).

Reason:
- Simple CRUD operations sufficient for MVP
- No database setup or maintenance required
- Non-technical user can view/edit data directly in sheets
- Rapid iteration without migrations
- Data portability (export to CSV/Excel easily)

**2024-12-XX | Two-Sheet Structure | Separate sheets for clients and workouts**

Decision: Use two separate Google Sheets tabs: "Clients" and "Workouts".

Reason:
- Clear separation of data types
- Easier to query and manage
- Workouts linked to clients via clientId
- Simpler than single sheet with complex relationships

---

## Development Decisions

**2024-12-XX | Keep Simple Two-Sheet Structure (Not One Tab Per Client) | Simplicity and MVP Focus**

Decision: Maintain the two-sheet structure (Clients sheet + Workouts sheet) instead of creating one tab per client.

Reason:
- Simpler implementation - no tab creation/management complexity
- No Google Sheets tab limits (200 tabs max) to worry about
- Easier to query all workouts if needed in the future
- Trainers can sort the Workouts sheet by `clientId` in Google Sheets UI to view workouts organized by client
- Aligns with MVP principle of keeping things simple
- Native Google Sheets sorting is sufficient for trainer's viewing needs

Alternative considered: One tab per client (first tab = Clients, subsequent tabs = one per client)
- Would provide better visual organization per client
- But adds complexity: tab creation, naming conflicts, tab management
- Not necessary for MVP - sorting achieves the same viewing benefit with less complexity

**2026-01-10 | Automatic Sheet Initialization | Reduce Setup Friction**

Decision: Automatically create sheet tabs ("Clients" and "Workouts") and populate headers if they don't exist when accessing sheets.

Reason:
- Reduces setup friction for users - no manual sheet/header creation required
- Makes the app more user-friendly, especially for non-technical trainers (target user)
- Idempotent implementation - checks if sheets/headers exist before creating
- Handles edge cases where headers might be missing or incorrect
- Improves developer experience - less manual setup needed for testing

Implementation:
- Added `ensureSheetExists()` function to create sheets if missing
- Added `ensureHeadersExist()` function to add/update headers if missing or incorrect
- Functions called automatically when accessing sheets (getAllClients, createClient, getWorkoutsByClientId, createWorkout)
- Diagnostic endpoint `/api/debug/sheets` added to check sheet setup status

Alternative considered: Require manual sheet/header setup
- Would require users to manually create sheets and headers
- Adds setup complexity and potential for errors
- Less user-friendly for non-technical users

**2026-01-10 | Express Route Ordering Pattern | Prevent 404 Route Errors**

Decision: Define Express Router routes from most specific to least specific, even with different HTTP methods.

Reason:
- Express Router matches routes in order, and more specific routes must come before less specific ones
- Example: `GET /clients/:id/workouts` must come before `PUT /clients/:id` and `DELETE /clients/:id`
- Wrong ordering causes Express to return 404 HTML page instead of JSON error, making debugging difficult
- Prevents routing conflicts and ensures proper route matching

Implementation:
- Route order in `src/api/routes.js`:
  1. GET `/clients/:id/workouts` (most specific - must come first)
  2. PUT `/clients/:id` (less specific)
  3. DELETE `/clients/:id` (same specificity as PUT)
- Comments added to routes explaining ordering requirements
- Middleware order: API routes registered before static file middleware

**2026-01-10 | Comprehensive Error Handling | Improve Debugging Experience**

Decision: Provide detailed error messages and logging throughout the application, both frontend and backend.

Reason:
- Generic error messages (like "Request failed") hide actual issues and make debugging difficult
- Detailed error messages help users and developers identify problems faster
- Better error handling reveals root causes (e.g., route ordering issues, missing data)
- Improves user experience with actionable error messages

Implementation:
- Backend: Detailed error logging with context (range, rowIndex, sheetRowNumber, spreadsheetId)
- Backend: Error messages list available options when resource not found (e.g., available client IDs)
- Frontend: Parse error responses properly, handle both JSON and non-JSON errors
- Frontend: Show actual HTTP status and error text instead of generic messages
- Frontend: Handle 204 No Content responses for DELETE endpoints
- Diagnostic endpoint `/api/debug/sheets` for quick setup verification

**2026-01-XX | Delete Client Button in Sidebar | Simplified UI for Better Usability**

Decision: Move delete client button from client details section to sidebar next to each client name as a hoverable X button.

Reason:
- Simplifies the UI by removing clutter from the client details section
- Makes delete action more accessible - visible where clients are listed
- Hoverable X pattern is intuitive and common in modern UIs
- Keeps the UI clean - delete button only appears on hover
- Aligns with user feedback to make UI simple and easy to use

Implementation:
- Delete button (×) appears next to each client name in the sidebar
- Button is hidden by default (opacity: 0) and appears on hover (opacity: 1)
- Button turns red on hover to indicate destructive action
- Clicking delete button stops event propagation to prevent selecting the client
- Removed delete button from client details header section
- Added proper event handling to prevent accidental deletions

**2026-01-XX | Normalized Workout Data Structure (One Row Per Set) | Enable Future Metrics and Progression Tracking**

Decision: Migrate Workouts sheet from JSON-based structure (one row per workout with exercises as JSON string) to normalized structure (one row per set).

Reason:
- **Future-proof for metrics**: Enables easy querying of individual exercises/sets for progression tracking, volume analysis, PR tracking
- **Google Sheets compatibility**: Works well with native formulas (SUMIFS, AVERAGEIFS, MAXIFS) and pivot tables
- **Query performance**: Easy to filter, sort, and aggregate by exercise, date, weight, etc.
- **Data integrity**: Each set is a separate row, making it easier to track individual set progression
- **Scalability**: Google Sheets handles millions of rows well, normalized structure scales better than JSON parsing

Structure:
- **Old**: One row per workout, `exercises` column contains JSON string: `[{"exerciseName": "...", "sets": [...]}]`
- **New**: One row per set, columns: `workoutId`, `clientId`, `date`, `exerciseName`, `setNumber`, `reps`, `weight`, `volume`, `notes`, `createdAt`
- Multiple rows share the same `workoutId` to represent a complete workout session
- `volume` = `reps × weight` (calculated per set, stored for easy aggregation)
- `setNumber`: Sequential number for sets within an exercise (1, 2, 3...)

Implementation:
- Updated `src/utils/transform.js` with `rowToWorkoutSet()` and `workoutSetToRow()` functions
- Updated `rowsToWorkouts()` to group sets by `workoutId` and reconstruct workout objects
- Updated `workoutToRows()` to convert workout objects to multiple rows (one per set)
- Updated all CRUD operations in `src/api/sheets.js` to handle normalized structure
- Application still uses workout object structure (with exercises array) internally
- Migration script `scripts/migrate-workouts-to-normalized.js` created for converting existing data

Benefits:
- Easy to query: "Show me all Back Squat sets for client-1"
- Easy to calculate progression: Compare weight/reps over time per exercise
- Easy to filter: "Show workouts where weight > 200"
- Easy to aggregate: "Average weight per exercise", "Total volume per workout"
- Future metrics become trivial: PR tracking, volume trends, exercise frequency

Alternative considered: Keep JSON-based structure
- Simpler to implement initially
- But makes future metrics and analysis difficult
- Requires parsing JSON for every query
- Not compatible with Google Sheets native formulas

**2026-01-XX | Avoid Duplicate Function Declarations | Prevent Syntax Errors**

Decision: Always search for existing function declarations before adding new functions to avoid duplicate declarations.

Reason:
- Duplicate function declarations cause `Uncaught SyntaxError: Identifier 'functionName' has already been declared` errors
- This commonly happens when refactoring or adding features without checking for existing implementations
- Browser/JavaScript engines don't allow duplicate function declarations in the same scope
- Prevents runtime errors and improves code quality

Prevention Strategy:
- Before adding a function, search the file for existing declarations using `grep` or IDE search
- When refactoring functions, search for all occurrences first, then update/remove duplicates
- Keep the most complete/robust version when duplicates are found
- Use code search tools (`grep`, IDE search) to find all occurrences before modifying

Example:
- If `setDefaultDate()` exists at line 100, don't add another `setDefaultDate()` at line 500
- Instead, update the existing function or remove the duplicate if refactoring

**2026-01-XX | Browser Import Path Patterns | Ensure Frontend Imports Work**

Decision: Use absolute import paths (`/utils/`) for browser-side dynamic imports and ensure dev server serves utility directories.

Reason:
- Relative import paths (`../utils/`) may not resolve correctly in browser environments
- Browser ES modules resolve imports relative to the module's URL, not file system paths
- Dev server must explicitly serve utility directories for imports to work
- Build scripts must copy utility files to `public/` for production deployments

Implementation:
- **Import paths**: Use absolute paths like `/utils/exerciseNormalize.js` instead of `../utils/exerciseNormalize.js`
- **Dev server**: Add `app.use('/utils', express.static(path.join(__dirname, '../utils')));` to serve utils directory
  - **Critical**: Use `path.join(__dirname, '../utils')` instead of `'src/utils'` to ensure Express static middleware works regardless of working directory
  - **ES Modules**: Use `import path from 'path'`, `import { fileURLToPath } from 'url'`, then `const __dirname = path.dirname(fileURLToPath(import.meta.url));` to get `__dirname` equivalent
- **Build script**: Include `mkdir -p public/utils && cp -r src/utils/*.js public/utils/` to copy utils files
- **Error handling**: Wrap dynamic imports in try-catch blocks, especially when used with loading states
- **Client-side utilities**: Don't import server-side utilities (like `../api/sheets.js`) in browser code - use `state` or API calls instead

Prevention Strategy:
- Always use absolute paths for browser-side dynamic imports
- Ensure dev server serves all directories that contain imported modules
- Ensure build scripts copy all imported utility files
- Test imports work in both dev and production (build) environments
- Use `state` data when available instead of importing server-side utilities

Example:
- ✅ `await import('/utils/exerciseNormalize.js')` - Works in browser
- ❌ `await import('../utils/exerciseNormalize.js')` - May fail in browser
- ✅ `app.use('/utils', express.static(path.join(__dirname, '../utils')));` - Serves utils in dev (with absolute path)
- ❌ `app.use('/utils', express.static('src/utils'));` - May fail if server started from different directory
- ✅ Build script copies utils: `cp -r src/utils/*.js public/utils/` - Works in production
- ✅ ES Modules `__dirname`: `const __dirname = path.dirname(fileURLToPath(import.meta.url));` - Required for path resolution

---

## Decision Categories

Decisions may fall into:
- **Technology choices** - frameworks, libraries, tools
- **Architecture patterns** - how code is organized
- **Process decisions** - how work is done
- **Design decisions** - UI/UX choices
- **Data decisions** - how data is stored/accessed

---

## When to Document a Decision

Document a decision when:
- It affects the architecture or structure
- It's not obvious why a choice was made
- Future agents might question the choice
- It sets a precedent for future work

---

## Decision Evolution

Decisions can be revisited:
- Document the change in a new entry
- Explain why the decision changed
- Update affected code and documentation

---

**This file grows over time. Keep it current.**

