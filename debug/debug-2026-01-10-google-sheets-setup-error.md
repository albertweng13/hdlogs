# Debug Session: Google Sheets Setup Error

**Date**: 2026-01-10
**Issue**: Error "Unable to parse range: Clients!A:Z" when trying to access Google Sheets

## Issue Summary

When running the app after adding `.env` file, the API endpoint `/api/clients` returned error:
```
{"error":"Failed to get data from sheet Clients: Unable to parse range: Clients!A:Z"}
```

## Root Cause

1. **Server needed restart**: The server was started before the `.env` file existed, so it didn't load the Google Sheets credentials
2. **Poor error messaging**: The error didn't clearly indicate what was wrong - could be missing sheet, permission issue, or other problem

## Solution

1. **Restarted server** to load new `.env` file with credentials
2. **Improved error handling** in `src/api/sheets.js`:
   - Added `getAvailableSheets()` function to list existing sheet tabs
   - Enhanced `getSheetData()` error handling to check if sheet exists and list available sheets in error message
   - Enhanced `appendRow()` error handling with same diagnostic information
3. **Added diagnostic endpoint** `/api/debug/sheets` to check spreadsheet setup status

## Context Updates

No design or decision changes needed - this was a setup/debugging issue.

## Verification

- ✅ Diagnostic endpoint shows both "Clients" and "Workouts" sheets exist
- ✅ GET `/api/clients` now returns empty array (correct for empty sheet)
- ✅ POST `/api/clients` successfully creates client
- ✅ GET `/api/clients` successfully retrieves created client

## Prevention Strategy

- **Better error messages**: Future errors about missing sheets will now clearly list available sheets
- **Diagnostic endpoint**: `/api/debug/sheets` can be used to quickly check spreadsheet setup
- **Documentation**: The improved error messages guide users to fix the issue

## Files Modified

- `src/api/sheets.js` - Added `getAvailableSheets()` and improved error handling in `getSheetData()` and `appendRow()`
- `src/api/routes.js` - Added `/api/debug/sheets` diagnostic endpoint

## Key Learning

Always restart the server after adding/modifying `.env` file - environment variables are loaded at server startup, not on each request.

