# Debug Session: Vercel Deployment Runtime Error

**Date**: 2026-01-XX  
**Issue**: Vercel deployment error - "Function Runtimes must have a valid version, for example `now-php@1.0.0`"

## Issue Summary

Vercel deployment was failing with a runtime error indicating that function runtimes must have a valid version. The error occurred because Vercel was unable to auto-detect the Node.js runtime for the serverless function in `api/index.js`.

## Root Cause

The error occurred because the `runtime` format `nodejs20.x` in the `functions` section was not recognized by Vercel. Vercel expects either:
1. Auto-detection (no explicit runtime, relies on `engines` in `package.json`)
2. Correct runtime format: `vercel/node@20.x` or `@vercel/node@20.x` (not `nodejs20.x`)

## Solution

**Approach 1 (Current - Recommended)**: Remove explicit runtime, rely on auto-detection:
1. **Removed `functions` section from `vercel.json`**:
   - Vercel auto-detects Node.js runtime for files in `api/` directory
   - Explicit runtime specification was causing the error

2. **Updated `engines` field in `package.json`**:
   - Changed from `"node": ">=18.0.0"` to `"node": "20.x"`
   - More specific version helps Vercel detect the correct runtime

**Approach 2 (Fallback - if Approach 1 doesn't work)**: Use correct runtime format:
- If auto-detection still fails, add back `functions` section with format: `"runtime": "vercel/node@20.x"`
- Or try: `"runtime": "@vercel/node@20.x"`

## Context Files Updated

- ✅ `vercel.json` - Removed `functions` section (let Vercel auto-detect based on `engines`)
- ✅ `package.json` - Updated `engines` field from `">=18.0.0"` to `"20.x"` for more specific version
- ✅ `ai-context/04-DEV-TEST.md` - Will be updated to reflect auto-detection approach

## Prevention Strategy

- Use `engines` field in `package.json` for Node.js version (recommended by Vercel)
- Avoid explicit `runtime` in `functions` section unless necessary (can cause format errors)
- If explicit runtime is needed, use correct format: `vercel/node@20.x` (not `nodejs20.x`)

## Key Learnings

- Vercel's recommended approach is to use `engines` in `package.json` and let it auto-detect
- The runtime format `nodejs20.x` is incorrect - should be `vercel/node@20.x` if explicitly needed
- Removing the `functions` section and relying on `engines` is the preferred solution
- If explicit runtime is required, must use format: `vercel/node@20.x` or `@vercel/node@20.x`

