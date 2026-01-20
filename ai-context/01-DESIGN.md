# MVP Design Document: Warbak Trainer

## Purpose

Warbak Trainer is a web application that enables personal gym trainers to organize and manage their clients' workout data. The app provides a clean, simple interface for non-technical trainers to input, organize, and view client information and workout sessions, with Google Sheets serving as the backend data store.

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
- **Left/Left Panel**: Client list (always visible)
- **Right/Main Panel**: Selected client's details, workout history, and workout input form (updates based on selection)

### Flow 1: Add New Client and Input First Workout
1. Trainer opens the application (single page loads)
2. Trainer sees client list on one side and empty/placeholder on the other
3. Trainer clicks "Add New Client" button
4. Client input form appears (inline or in main panel)
5. Trainer enters client information (name, contact info, basic details)
6. Trainer saves the client
7. New client appears in client list and is automatically selected
8. Main panel shows client details and workout input form
9. Trainer enters workout data (date, exercises, sets, reps, weights, notes) in the form
10. Trainer saves the workout
11. Workout immediately appears in the client's workout history section on the same page

### Flow 2: View Client List and Select Client
1. Trainer opens the application
2. Trainer sees client list on one side of the page
3. Trainer clicks on a client name in the list
4. Main panel updates to show that client's details and workout history (no page reload)
5. Workout input form is available for that client

### Flow 3: Input Workout for Existing Client
1. Trainer opens the application
2. Trainer sees client list and selects an existing client
3. Main panel shows client details and workout history
4. Trainer uses the workout input form (visible in main panel)
5. Trainer enters workout data (date, exercises, sets, reps, weights, notes)
6. Trainer saves the workout
7. New workout immediately appears in the workout history section on the same page (no page reload)

### Flow 4: View Client Workout History
1. Trainer opens the application
2. Trainer sees client list on one side
3. Trainer clicks on a client
4. Main panel updates to show that client's workout history
5. Workouts displayed in chronological order (newest or oldest first)
6. All visible on the same page without navigation

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

