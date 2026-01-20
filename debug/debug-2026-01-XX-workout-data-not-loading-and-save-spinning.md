# Debug Session: Workout Data Not Loading and Save Entry Spinning

**Date**: 2026-01-XX
**Issue**: 
1. Data not loading from previous workouts
2. Save entry is just spinning (loading overlay never disappears)

## Issue Summary

User reported two related issues:
1. Workout history data not loading when selecting a client
2. When trying to save a workout entry, the loading spinner appears but never disappears

## Root Cause

Multiple issues were found:

1. **Missing Function**: The function `updateWorkoutDefaults()` was being called but never defined, causing JavaScript errors that prevented code execution.

2. **Import Error Handling**: In `handleAddWorkout()`, the `showLoading()` call and dynamic import were outside the try-catch block. If the import failed, the error wasn't caught and `hideLoading()` in the finally block was never reached, causing the spinner to hang.

3. **Import Path Issues**: 
   - Import paths used `../utils/exerciseNormalize.js` which might not resolve correctly in browser
   - The dev server wasn't serving the `utils` directory, so imports would fail
   - The build script didn't copy `utils` files to `public/` directory

4. **Server-Side Utility in Browser**: `renderExerciseSuggestions` was trying to import `workoutDefaults.js`, which imports server-side code (`../api/sheets.js`), causing import failures in the browser.

## Solution

1. **Added Missing Function**: Implemented `updateWorkoutDefaults()` function that:
   - Uses `state.workouts` (already loaded) instead of calling server-side utilities
   - Uses exercise normalization utility for comparison
   - Finds the most recent workout set for the exercise
   - Updates weight/reps inputs only if they're empty

2. **Fixed Error Handling**: Moved `showLoading()` call and import statement inside try-catch block in `handleAddWorkout()` to ensure `hideLoading()` is always called.

3. **Fixed Import Paths**: 
   - Changed all import paths from `../utils/` to `/utils/` (absolute paths)
   - Updated dev server (`src/api/server.js`) to serve utils directory using absolute paths: `app.use('/utils', express.static(path.join(__dirname, '../utils')));`
   - Updated build script to copy utils files: `mkdir -p public/utils && cp -r src/utils/*.js public/utils/`
   - **Critical fix**: Used `path.join(__dirname, '../utils')` instead of relative path `'src/utils'` to ensure Express static middleware works correctly regardless of working directory

4. **Fixed Browser Compatibility**: Updated `renderExerciseSuggestions` to use `state.workouts` directly instead of importing `workoutDefaults.js` (which has server-side dependencies).

## Context Updates Made

**Primary focus - prevent recurrence:**

- ✅ `ai-context/04-DEV-TEST.md` - Added "Browser Import Path Issues" section to Common Issues with:
  - Import path resolution in browser vs server
  - Need to serve utility directories
  - Need to copy utility files during build
  - Absolute vs relative import paths

- ✅ `ai-context/05-DECISIONS.md` - Added decision entry documenting:
  - Browser import path patterns (`/utils/` instead of `../utils/`)
  - Server configuration for serving utility directories
  - Build script requirements for copying utility files
  - Client-side vs server-side utility usage patterns

## Follow-up Tasks Added

No sprint tasks needed - fixes are complete and prevention is documented in ai-context files.

## Prevention Strategy

**When adding dynamic imports in frontend code:**
1. Use absolute paths (`/utils/`) instead of relative paths (`../utils/`) for browser compatibility
2. Ensure dev server serves utility directories: `app.use('/utils', express.static('src/utils'));`
3. Ensure build script copies utility files: `mkdir -p public/utils && cp -r src/utils/*.js public/utils/`
4. Wrap imports in try-catch blocks, especially when `showLoading()` is called before imports
5. Don't import server-side utilities (like `../api/sheets.js`) in browser code - use `state` or API calls instead

**Best Practices:**
- Always wrap dynamic imports in try-catch when they're used in functions that show loading states
- Test import paths work in both dev and production (build) environments
- Use `state` data when available instead of importing server-side utilities in browser code
- Ensure `hideLoading()` is always called in finally blocks

## Files Modified

- `src/frontend/app.js` - Added `updateWorkoutDefaults()` function, fixed import error handling, updated import paths, fixed workoutDefaults usage
- `src/api/server.js` - Added utils directory serving with absolute paths: `app.use('/utils', express.static(path.join(__dirname, '../utils')));` (uses `path` and `fileURLToPath` for ES modules)
- `package.json` - Updated build script to copy utils files: `mkdir -p public/utils && cp -r src/utils/*.js public/utils/`

## Key Learning

1. **Missing function definitions** cause JavaScript errors that prevent code execution
2. **Import error handling** must be inside try-catch blocks, especially when loading states are involved
3. **Browser import paths** need to be absolute (`/utils/`) and the server must serve those directories
4. **Build scripts** must copy all utility files that are imported by frontend code
5. **Server-side utilities** cannot be imported in browser code - use state or API calls instead

