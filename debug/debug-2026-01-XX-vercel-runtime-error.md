# Debug Session: Vercel Deployment Runtime Error

**Date**: 2026-01-XX  
**Issue**: Vercel deployment error - "Function Runtimes must have a valid version, for example `now-php@1.0.0`"

## Issue Summary

Vercel deployment was failing with a runtime error indicating that function runtimes must have a valid version. The error occurred because Vercel was unable to auto-detect the Node.js runtime for the serverless function in `api/index.js`.

## Root Cause

The `vercel.json` configuration relied on Vercel's auto-detection of Node.js runtime for files in the `api/` directory, but auto-detection was failing. Vercel requires explicit runtime specification when auto-detection doesn't work.

## Solution

1. **Added explicit `functions` section to `vercel.json`**:
   - Specified `nodejs20.x` runtime for `api/index.js`
   - This ensures Vercel knows which runtime to use for the serverless function

2. **Added `engines` field to `package.json`**:
   - Specified `"node": ">=18.0.0"` in engines field
   - Provides additional Node.js version specification for Vercel

## Context Files Updated

- ✅ `vercel.json` - Added `functions` section with explicit Node.js runtime
- ✅ `package.json` - Added `engines` field for Node.js version
- ✅ `ai-context/04-DEV-TEST.md` - Updated Vercel configuration documentation:
  - Updated "How Vercel Configuration Works" section to reflect explicit runtime
  - Updated configuration notes to mention `functions` section
  - Updated troubleshooting section with runtime specification guidance

## Prevention Strategy

- Explicit runtime specification in `vercel.json` prevents auto-detection failures
- `engines` field in `package.json` provides fallback version specification
- Documentation updated to reflect that explicit runtime is required (not optional)

## Key Learnings

- Vercel's auto-detection of Node.js runtime can fail in some cases
- Explicit runtime specification in `vercel.json` functions section is more reliable
- Both `vercel.json` functions section and `package.json` engines field should be used for consistency

