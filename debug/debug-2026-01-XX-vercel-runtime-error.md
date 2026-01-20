# Debug Session: Vercel Deployment Runtime Error

**Date**: 2026-01-XX  
**Issue**: Vercel deployment error - "Function Runtimes must have a valid version, for example `now-php@1.0.0`"

## Issue Summary

Vercel deployment was failing with a runtime error indicating that function runtimes must have a valid version. The error occurred because Vercel was unable to auto-detect the Node.js runtime for the serverless function in `api/index.js`.

## Root Cause

The error occurred because the `runtime` format `nodejs20.x` in the `functions` section was not recognized by Vercel. Vercel expects either:
1. Auto-detection (no explicit runtime, relies on `engines` in `package.json`)
2. Correct runtime format: `vercel/node@20.x` or `@vercel/node@20.x` (not `nodejs20.x`)

## Solution (FINAL - WORKING)

**The Fix**: Remove `functions` section entirely and rely on Vercel's auto-detection:

1. **Removed `functions` section from `vercel.json` completely**:
   - Vercel automatically detects Node.js runtime for files in `api/` directory
   - No explicit runtime specification needed for official Node.js runtime
   - The error was caused by trying to specify a runtime format that Vercel didn't recognize

2. **Keep `engines` field in `package.json`**:
   - Set to `"node": "20.x"` (specific version, not range)
   - Vercel uses this to determine Node.js version
   - Warning message confirms Vercel is reading this correctly

3. **Keep API rewrite in `vercel.json`**:
   - `"source": "/api/:path*"` → `"destination": "/api/index.js"`
   - This routes all API requests to the serverless function

**What Didn't Work**:
- `"runtime": "nodejs20.x"` - Invalid format
- `"runtime": "@vercel/node"` - Still triggered error
- `"runtime": "vercel/node@20.x"` - Not needed for official runtimes
- Any `functions` section with `runtime` key - Causes the error

**Key Learning**: For official Node.js runtime, DO NOT specify `runtime` in `functions` section. Vercel auto-detects based on file location (`api/` directory) and `engines` in `package.json`.

## Context Files Updated

- ✅ `vercel.json` - Removed `functions` section completely (let Vercel auto-detect Node.js runtime)
- ✅ `package.json` - Updated `engines` field from `">=18.0.0"` to `"20.x"` for specific version
- ✅ `ai-context/04-DEV-TEST.md` - Updated to reflect auto-detection approach (no `functions` section needed)

## Result

✅ **Build Successful** - Deployment now works correctly. Vercel auto-detects Node.js 20.x from `engines` field and treats `api/index.js` as a serverless function automatically.

## Prevention Strategy

- Use `engines` field in `package.json` for Node.js version (recommended by Vercel)
- Avoid explicit `runtime` in `functions` section unless necessary (can cause format errors)
- If explicit runtime is needed, use correct format: `vercel/node@20.x` (not `nodejs20.x`)

## Key Learnings

- Vercel's recommended approach is to use `engines` in `package.json` and let it auto-detect
- The runtime format `nodejs20.x` is incorrect - should be `vercel/node@20.x` if explicitly needed
- Removing the `functions` section and relying on `engines` is the preferred solution
- If explicit runtime is required, must use format: `vercel/node@20.x` or `@vercel/node@20.x`

