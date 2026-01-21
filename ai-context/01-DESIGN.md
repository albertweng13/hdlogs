# MVP Design Document: hdlogs

## Purpose

hdlogs is a web application that enables personal gym trainers to organize and manage their clients' workout data. The app provides a clean, simple interface for non-technical trainers to input, organize, and view client information and workout sessions, with Google Sheets serving as the backend data store.

## Primary User

**Personal gym trainer** (non-technical user)
- Needs to manage multiple clients
- Requires simple, intuitive interface
- Will use the app during or after training sessions
- Needs quick access to client information and workout history

## MVP Scope (Must-Haves)

### Core Features

1. **Add New Client**
   - Capture basic client information (name, contact info, basic details)
   - Store in Google Sheets

2. **View Client List**
   - Display all clients in a simple, organized list
   - Allow quick access to individual client details

3. **Input Workout Data**
   - Record workout sessions for clients
   - Capture: date, exercises, sets, reps, weights, notes
   - Store in Google Sheets linked to client

4. **View Client Workout History**
   - Display all workout sessions for a specific client
   - Show workout data in chronological order
   - Simple, readable format

### Technical Requirements

- Web application (browser-based)
- **Single-page application** - all functionality accessible on one page (no navigation between pages)
- Google Sheets as backend (simple CRUD operations)
- Clean, simple UI suitable for non-technical users
- Data persistence in Google Sheets

## Explicit Non-Goals

The following features are **explicitly excluded** from Iteration 1:

- ❌ Metrics/progress visualization (charts, graphs, analytics)
- ❌ Progress tracking or trend analysis
- ❌ Payment tracking or billing
- ❌ Scheduling or calendar features
- ❌ Client photos or media uploads
- ❌ Advanced search or filtering beyond basic client list
- ❌ Data export/import functionality
- ❌ Multi-user or trainer collaboration
- ❌ Mobile app (web-only for MVP)
- ❌ Multi-page navigation or routing (single-page only)

## Core User Flows

**Note: All flows occur on a single page. No page navigation or routing.**

### Single-Page Layout Structure
- **Left Panel**: Client list (always visible)
- **Right/Main Panel**: 
  - When no client selected: Empty state message
  - When client selected: 
    - **Client Info View**: Three boxes displayed:
      - **Client Info Box**: Shows client details (name, email, phone, notes) with Edit button
      - **New Session Box**: Button to start a new workout session
      - **Stats Box**: Placeholder for future stats feature (marked as "Coming Soon")
    - **New Session View**: Workout entry form with back button
    - **Recent Sessions**: Always visible at bottom when client is selected (shows workout history table)

### Flow 1: Add New Client and Input First Workout
1. Trainer opens the application (single page loads)
2. Trainer sees client list on left and empty state message on right
3. Trainer clicks "Add New Client" button
4. Client input modal appears
5. Trainer enters client information (name, contact info, basic details)
6. Trainer saves the client
7. Success notification appears: "Client created successfully!"
8. New client appears in client list and is automatically selected
9. Main panel shows **Client Info View** with three boxes:
   - Client Info box (with client details and Edit button)
   - New Session box (with "Start New Session" button)
   - Stats box (placeholder)
10. Recent Sessions table appears at bottom (initially empty)
11. Trainer clicks "Start New Session" button
12. View smoothly transitions to **New Session View** showing workout entry form
13. Trainer enters workout data (date, exercises, sets, reps, weights, notes)
14. Trainer saves the workout entry
15. Success notification appears: "Workout entry saved successfully!"
16. View automatically transitions back to Client Info View after 500ms
17. Workout immediately appears in the Recent Sessions table at bottom

### Flow 2: View Client List and Select Client
1. Trainer opens the application
2. Trainer sees client list on left side of the page
3. Trainer clicks on a client name in the list
4. Main panel updates to show **Client Info View** with three boxes:
   - Client Info box (with selected client's details)
   - New Session box
   - Stats box
5. Recent Sessions table appears at bottom showing that client's workout history
6. All visible on the same page without navigation

### Flow 3: Input Multiple Workouts in a Session
1. Trainer opens the application
2. Trainer sees client list and selects an existing client
3. **Client Info View** appears with three boxes and Recent Sessions at bottom
4. Trainer clicks "Start New Session" button
5. View smoothly transitions to **New Session View** showing workout entry form
6. Trainer enters first workout entry (date, exercise, sets, reps, weights, notes)
7. Trainer saves the entry
8. Success notification appears: "Workout entry added to session!"
9. Form clears and trainer can add another entry to the same session
10. Trainer adds multiple entries (all entries merge into the same workout session)
11. Trainer clicks "End Session" button (top right) or back arrow (top left) when done
12. View transitions back to Client Info View
13. All entries appear as one workout session in Recent Sessions table

### Flow 4: Navigate Between Views
1. Trainer selects a client → **Client Info View** appears
2. Trainer clicks "Start New Session" → View transitions to **New Session View**
3. Trainer clicks "← Back" button → View transitions back to **Client Info View**
4. Recent Sessions table remains visible at bottom throughout navigation

### Flow 5: Edit Client Information
1. Trainer selects a client → **Client Info View** appears
2. Trainer clicks "Edit" button in Client Info box
3. Client edit modal appears
4. Trainer updates client information
5. Trainer saves changes
6. Client Info box updates with new information
7. Recent Sessions remain visible at bottom

## Workout Session Determination

**Behavior**: Each "New Session" creates a **workout session** that can contain multiple workout entries.

- When the user clicks "Start New Session", they enter **session mode**
- The first workout entry saved creates a new workout session with a unique `workoutId`
- Subsequent entries in the same session are **merged** into that workout session
- Multiple entries can be added to the same session (all exercises and sets accumulate)
- User clicks "End Session" or back arrow to exit session mode and return to Client Info View
- Multiple separate workout sessions can exist on the **same date** for the same client
- Each workout session is independent and can contain multiple exercises, each with multiple sets
- Workout sessions are identified by their unique `workoutId`

**Session Flow**:
1. Click "Start New Session" → Enter session mode
2. Add workout entries → Each entry merges into the current session
3. Click "End Session" or back arrow → Exit session mode, session is finalized
4. Session appears in Recent Sessions table as one workout session

**Implication**: 
- Users can add multiple workout entries to build up a complete session
- All entries in a session are grouped together as one workout session
- Users can have multiple separate workout sessions on the same day
- Each session represents a distinct workout session (e.g., morning session vs. evening session)
- Sessions are displayed in the Recent Sessions table, grouped by date if enabled
- Each session can be edited or deleted independently

## Data Model / Interfaces

### Client Data Structure
- **clientId**: string (unique identifier, auto-generated)
- **name**: string (client's full name)
- **email**: string (client's email address, optional)
- **phone**: string (client's phone number, optional)
- **notes**: string (general notes about the client, optional)
- **createdAt**: string (date when client was added, ISO format)

### Workout Data Structure
- **workoutId**: string (unique identifier, auto-generated)
- **clientId**: string (reference to client)
- **date**: string (workout date, ISO format)
- **exercises**: array of exercise objects, where each exercise contains:
  - **exerciseName**: string (name of exercise, e.g., "Bench Press")
  - **sets**: array of set objects, where each set contains:
    - **reps**: number (number of repetitions)
    - **weight**: number (weight in lbs/kg)
    - **notes**: string (optional notes for this set)
- **notes**: string (general notes about the workout session, optional)
- **createdAt**: string (date when workout was recorded, ISO format)

### Google Sheets Structure

**Clients Sheet:**
- Columns: clientId, name, email, phone, notes, createdAt
- Each row represents one client

**Workouts Sheet:**
- Columns: workoutId, clientId, date, exerciseName, setNumber, reps, weight, volume, notes, createdAt
- Each row represents one set of one exercise in one workout session
- Multiple rows share the same workoutId to represent a complete workout session
- Normalized structure (one row per set) enables easy querying and metrics calculation
- `volume` = `reps × weight` (calculated per set, stored for easy aggregation)
- `setNumber`: Sequential number for sets within an exercise (1, 2, 3...)

**Note**: The application uses the workout object structure (with exercises array) internally, but stores data in normalized rows in Google Sheets. This enables future metrics and progression tracking while maintaining a clean application API.

## Success Criteria for Iteration 1

### Functional Success
- ✅ Trainer can add a new client with basic information
- ✅ Trainer can view a list of all clients
- ✅ Trainer can input a workout session for a client (including multiple exercises with sets, reps, and weights)
- ✅ Trainer can view a client's complete workout history
- ✅ All data persists in Google Sheets and is retrievable

### Usability Success
- ✅ Interface is clean and simple enough for a non-technical user
- ✅ All functionality accessible on a single page (no navigation needed)
- ✅ Core actions (add client, input workout) can be completed without confusion
- ✅ Data is displayed in a readable, organized format
- ✅ Page updates dynamically without reloads when adding clients or workouts

### Technical Success
- ✅ Application loads and functions in a web browser
- ✅ Google Sheets integration works reliably for CRUD operations
- ✅ No data loss during normal operations

## Assumptions / Open Questions

### Assumptions
- Trainer has a Google account and can set up Google Sheets API credentials
- Trainer will use the app primarily on a computer/laptop (web browser)
- Trainer understands basic workout terminology (sets, reps, weights)
- Google Sheets will have sufficient capacity for the trainer's client base (typically < 100 clients, < 1000 workouts)
- Trainer will manually manage Google Sheets permissions/access

### Open Questions
1. **Exercise Library**: Should there be a predefined list of exercises, or free-form text input? (MVP: Start with free-form, can add library later)
2. **Units**: Should weight be in lbs, kg, or user-configurable? (MVP: Default to lbs, can add config later)
3. **Date Format**: What date format is preferred? (MVP: Use standard date picker, display in readable format)
4. **Workout Template**: Should trainers be able to save workout templates? (MVP: No, explicit non-goal)
5. **Client Search**: Basic list view sufficient, or need search/filter? (MVP: Basic list, can add search later)
6. **Data Validation**: How strict should input validation be? (MVP: Basic validation to prevent errors, not overly strict)

### Technical Decisions Needed
- Frontend framework choice (React, Vue, vanilla JS, etc.) - must support single-page dynamic updates
- Google Sheets API authentication method (Service Account vs OAuth)
- Sheet structure (separate sheets vs single sheet with structured columns)
- Deployment platform (Vercel, Netlify, etc.)
- Single-page layout approach (split-panel, tabbed sections, or collapsible sections)

