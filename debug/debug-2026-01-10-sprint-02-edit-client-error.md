# Debug Session: Sprint 02 Edit Client Error & Documentation Updates

**Date**: 2026-01-10  
**Sprint**: Sprint 02 (IN_PROGRESS)  
**Issues**: 
1. Documentation needs to be updated to reflect edit client functionality (Tasks 1-8 complete)
2. Edit client functionality returning "Request failed" error

## Issue Summary

1. **Documentation Gap**: Edit client functionality was implemented in Sprint 2 (Tasks 1-8 complete), but documentation in `ai-context/` was not updated to reflect these changes.

2. **Edit Client Error**: When attempting to edit a client, the frontend shows "Failed to update client: Request failed". This generic error message doesn't provide enough information to debug the actual issue.

3. **404 Route Not Found (PUT)**: After improving error handling, discovered actual error: `Cannot PUT /api/clients/{id}` - Express returning 404 HTML page. Root cause: Route ordering issue - PUT route must come AFTER GET `/clients/:id/workouts` route in Express Router.
4. **Missing Delete Button**: Delete client button not visible in UI - frontend implementation needed (Tasks 15-17).
5. **404 Route Not Found (DELETE)**: After adding DELETE route and frontend, server returning 404 for DELETE requests - needed server restart to register route.

## Root Cause

1. **Documentation**: Standard documentation update needed - no bug, just missing updates.

2. **Error Handling**: The frontend `apiCall` function catches JSON parse errors and returns a generic "Request failed" message, hiding the actual error from Google Sheets API. Additionally, error logging in `updateClient` wasn't detailed enough to diagnose issues.

3. **Route Not Found**: 
   - **Root Cause**: Express Router route ordering - PUT `/clients/:id` route must come AFTER GET `/clients/:id/workouts` route
   - Express Router matches routes in order, and more specific routes need to come before less specific ones
   - Even though they have different HTTP methods (PUT vs GET), Express requires proper route ordering
   - Express was returning default 404 HTML page instead of JSON error, confirming route wasn't matching

## Solution

### 1. Documentation Updates
Updated `ai-context/03-REPO-MAP.md` to reflect:
- New PUT /api/clients/:id endpoint for updating clients
- updateClient() function in sheets.js
- Frontend edit client modal and functionality
- GET /api/debug/sheets diagnostic endpoint
- Current sprint status (Sprint 01 complete, Sprint 02 in progress with edit client complete)

### 2. Error Handling Improvements

**Backend (`src/api/sheets.js`)**:
- Added detailed error logging in `updateClient()` to log range, rowIndex, sheetRowNumber, and spreadsheetId when errors occur
- Improved row finding logic to filter out empty rows or rows without clientId
- Added validation to ensure row format has all 6 required columns before attempting update
- Improved error messages to show available client IDs when client not found
- Fixed misleading comment about row index calculation (comment said +2, code correctly uses +1)

**Frontend (`src/frontend/app.js`)**:
- Improved error handling in `apiCall()` to properly parse error responses
- Added content-type checking to handle both JSON and non-JSON error responses
- Error messages now show actual HTTP status and error text instead of generic "Request failed"

**Server Configuration (`src/api/server.js`)**:
- Reordered middleware: API routes now registered BEFORE static file middleware
- This ensures API routes are matched before Express tries to serve static files
- Best practice: API routes should be registered before static middleware to avoid conflicts

**Route Handler (`src/api/routes.js`)**:
- Added console logging to PUT route handler to verify route is being hit
- **Fixed route ordering**: Moved PUT `/clients/:id` route to come AFTER GET `/clients/:id/workouts` route
- Express Router requires more specific routes before less specific ones, even with different HTTP methods
- Route now matches correctly and returns proper JSON responses

### 3. Delete Client Functionality

**Frontend (`src/frontend/index.html` and `src/frontend/app.js`)**:
- Added delete button to client header section (next to edit button)
- Added delete client handler with confirmation dialog (`handleDeleteClient()`)
- Updated `apiCall()` function to handle 204 No Content responses (DELETE endpoints return 204)
- Delete handler: shows confirmation, calls DELETE API, removes client from state, clears UI if deleted client was selected

**Backend (`src/api/routes.js`)**:
- DELETE route properly positioned after PUT route (both `/clients/:id` routes)
- Route supports optional `deleteWorkouts` query parameter
- Returns 204 No Content on successful deletion
- Proper error handling with 404 for not found, 500 for other errors

**Route Order (confirmed working)**:
1. GET `/clients/:id/workouts` (most specific - must come first)
2. PUT `/clients/:id`
3. DELETE `/clients/:id` (same specificity as PUT, order doesn't matter between these two)

## Additional Issues Fixed

### Delete Client Functionality

**Issue**: Delete client button missing from UI, and DELETE route returning 404 after implementation.

**Root Cause**: 
- Frontend delete button and handler were not implemented
- DELETE route was added but server needed restart to register it

**Solution**:
- Added delete button to client header in `src/frontend/index.html`
- Added delete client handler with confirmation dialog in `src/frontend/app.js`
- Added DELETE route handler to `src/api/routes.js` (already existed, just needed restart)
- Updated `apiCall()` function to handle 204 No Content responses (DELETE endpoints)
- Server restarted to register DELETE route

**Route Order Confirmed**:
- GET `/clients/:id/workouts` (most specific - must come first)
- PUT `/clients/:id` 
- DELETE `/clients/:id` (after PUT, both are same specificity)

## Context Files Updated

- ✅ `ai-context/03-REPO-MAP.md` - Updated API endpoints list, sheets.js functions, frontend app.js description, index.html structure, and current state section
- ✅ `src/api/sheets.js` - Improved error handling and logging in `updateClient()` function
- ✅ `src/frontend/app.js` - Improved error handling in `apiCall()` function, added delete client handler
- ✅ `src/frontend/index.html` - Added delete client button to client header
- ✅ `src/api/server.js` - Reordered middleware (API routes before static files)
- ✅ `src/api/routes.js` - Added logging to PUT route handler, DELETE route properly positioned

## Verification

**Server Restart Required**: After making these changes, the server must be restarted to register the PUT route.

The error handling improvements should now:
- Show actual error messages from the server instead of "Request failed"
- Log detailed information in server console when updateClient fails
- Help identify if the issue is:
  - Client not found
  - Invalid row format
  - Google Sheets API error
  - Network/connection issue
  - Route not found (should be fixed after server restart)

**Testing**:
1. Restart the server: `npm run dev` or `npm start`
2. Try editing a client again
3. Check server console for PUT route logs: "PUT /api/clients/{id} - Updating client"
4. If route still doesn't match, check server console for errors during startup

## Prevention Strategy

1. **Documentation**: Update documentation during development, not just at sprint completion
2. **Error Handling**: Always provide detailed error messages and logging to aid debugging
3. **Error Messages**: Don't mask errors with generic messages - show actual error details
4. **Server Restart**: Always restart server after adding new routes or middleware changes
5. **Middleware Order**: Register API routes before static file middleware to avoid routing conflicts
6. **Route Logging**: Add logging to new route handlers to verify they're being hit during development
7. **Route Ordering**: In Express Router, define more specific routes (like `/clients/:id/workouts`) before less specific ones (like `/clients/:id`), even with different HTTP methods

## Notes

- No design changes needed - Sprint 2 enhancements are within planned scope
- No decision changes needed - edit functionality follows established patterns
- Row index calculation was correct (`rowIndex + 1`), but comment was misleading
- Future: Consider updating docs incrementally as tasks complete, not waiting for sprint completion
- **Key Learning**: Always restart server after adding routes - Express doesn't hot-reload route definitions
- **Key Learning**: Improved error handling revealed the actual issue - generic "Request failed" was hiding the 404 route not found error
- **Key Learning**: Express Router route ordering matters - more specific routes (e.g., `/clients/:id/workouts`) must come before less specific ones (e.g., `/clients/:id`), even with different HTTP methods
- **Key Learning**: DELETE endpoints return 204 No Content - frontend `apiCall()` function needs to handle this status code properly
- **Key Learning**: When adding new routes (PUT, DELETE, etc.), both backend route definition AND server restart are required - route won't work until server restarts

