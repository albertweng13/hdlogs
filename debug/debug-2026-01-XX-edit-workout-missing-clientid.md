# Debug Session: Edit Workout Missing Client ID

> **Date**: 2026-01-XX
> **Issue**: Failed to update workout: Client ID is required
> **Status**: RESOLVED

## What Happened

When submitting the edit workout form, the error "Failed to update workout: Client ID is required" was thrown. The edit workout form submission was not including `clientId` in the request body, but server-side validation requires it.

## Root Cause

The `handleWorkoutEditFormSubmit` function in `src/frontend/app.js` was only including `date`, `exercises`, and `notes` in the `workoutData` object when submitting the PUT request. However, the server-side validation function `validateWorkoutData()` requires `clientId` to be present and non-empty (line 68-70 in `src/api/routes.js`).

The validation runs when any of `exercises`, `date`, or `clientId` are provided in the request body (line 180), and since `exercises` and `date` were provided, validation ran and failed because `clientId` was missing.

## Solution

Updated `handleWorkoutEditFormSubmit` to:
1. Find the workout being edited from `state.workouts` using `state.editingWorkoutId`
2. Include `clientId` from the workout object in the `workoutData` sent to the API
3. Add error handling if the workout is not found in state

**File Changed**: `src/frontend/app.js` (lines 1678-1690)

## Context Updates Made

- [x] No design changes needed - this is a bug fix
- [x] No decision changes needed - validation requiring clientId is correct
- [x] No sprint tasks added - bug is fixed

## Follow-up Tasks Added

None - bug is fixed and follows existing pattern (create workout already includes clientId).

## Prevention Strategy

When editing existing entities, always include required fields that are not user-editable (like `clientId`). The workout object is available in state when opening the edit modal, so we can retrieve it during submission. This pattern is consistent with how workout creation includes `clientId` from the session.

