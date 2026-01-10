# Repository Map

This file describes the structure and organization of this repository.

## Intended Structure

This is a **Sheets-Backed App** (see `project-types/sheets-backed-app.md`). The structure follows patterns for a web application using Google Sheets as the backend.

```
warbak-trainer/
  src/
    api/
      sheets.js          # Google Sheets API client
      routes.js          # API endpoints (serverless functions)
    frontend/
      index.html         # Main HTML file (single-page app)
      styles.css         # Styles
      app.js             # Main application logic
      components/        # UI components (if needed)
    utils/
      transform.js       # Data transformation utilities
    config/
      credentials.js     # API credentials setup
  tests/
    unit/
      sheets.test.js
      transform.test.js
    integration/
      api.test.js
  .env.example          # API credentials template
  package.json
  README.md
```

## Major Folders/Modules

### `src/api/`
- **sheets.js**: Google Sheets API client wrapper
  - Functions to read/write/update/delete to Google Sheets
  - Handles authentication
  - Error handling for API calls
  - Automatic sheet and header initialization
  - Client CRUD operations (create, read, update, delete)
- **routes.js**: API endpoint definitions
  - GET /api/clients - List all clients
  - POST /api/clients - Create new client
  - PUT /api/clients/:id - Update client information
  - DELETE /api/clients/:id - Delete client (with optional deleteWorkouts query parameter)
  - GET /api/clients/:id/workouts - Get workouts for a client
  - POST /api/workouts - Create new workout
  - GET /api/debug/sheets - Diagnostic endpoint for sheet setup status

### `src/frontend/`
- **index.html**: Single-page application HTML
  - Client list panel (left side)
  - Client details/workout history panel (right side)
  - Client modal for adding/editing clients
  - Forms for adding clients and workouts
  - Edit and Delete client buttons in client details section
- **app.js**: Main application logic
  - State management (clients, selected client, workouts, editing state)
  - API calls to backend (CRUD operations)
  - UI updates (dynamic, no page reloads)
  - Client modal management (new/edit modes)
- **styles.css**: Application styles
  - Clean, simple design for non-technical users
  - Responsive layout (split-panel or similar)

### `src/utils/`
- **transform.js**: Data transformation utilities
  - Convert between Google Sheets row format and application data models
  - Handle exercise/set data structure conversions

### `src/config/`
- **credentials.js**: Google Sheets API credentials setup
  - Environment variable handling
  - Service account or OAuth configuration

### `tests/`
- **unit/**: Unit tests for utilities and business logic
- **integration/**: Integration tests for API endpoints with Google Sheets

## File Organization Principles

- **Logical grouping** - related code together
- **Clear separation** - API, frontend, and utilities in separate modules
- **Test co-location** - tests in `tests/` directory, organized by type
- **Single-page app** - all frontend code in one HTML file with inline JS/CSS or separate files

## Google Sheets Structure

The application uses two Google Sheets:

### Clients Sheet
- Columns: `clientId`, `name`, `email`, `phone`, `notes`, `createdAt`
- Each row represents one client

### Workouts Sheet
- Columns: `workoutId`, `clientId`, `date`, `exercises` (JSON string), `notes`, `createdAt`
- Each row represents one workout session
- `exercises` column contains JSON string of exercise array with sets/reps/weights
- **Trainers can sort this sheet by `clientId` in Google Sheets** to view workouts organized by client (see `SHEET_SETUP.md` for instructions)

*Note: Exact sheet structure will be finalized during implementation. May use structured columns for exercises/sets if JSON proves problematic.*

## Evolution

This file will evolve as the repository grows. Update it when:
- New major directories are added
- Structure changes significantly
- Organization principles change
- Google Sheets structure is finalized

## Current State

**Sprint 01 Complete**: Core MVP implemented with full CRUD operations for clients and workouts. Client list, client details, workout input, and workout history all functional.

**Sprint 02 In Progress**: Edit client functionality implemented (Tasks 1-8 complete). PUT /api/clients/:id endpoint, updateClient() function, frontend edit modal, and related tests are complete.

