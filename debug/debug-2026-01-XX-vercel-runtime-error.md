# Debug Session: Vercel Deployment Errors

**Date**: 2026-01-XX  
**Issues**: 
1. Vercel deployment error - "Function Runtimes must have a valid version, for example `now-php@1.0.0`"
2. Vercel deployment error - "No Output Directory named 'public' found after the Build completed"
3. 404 NOT_FOUND errors after deployment

## Issue Summary

Multiple Vercel deployment errors occurred:
1. **Runtime Error**: "Function Runtimes must have a valid version" - caused by incorrect runtime specification
2. **Output Directory Error**: "No Output Directory named 'public' found" - Vercel expected a `public` directory after build
3. **404 Errors**: Static files not being served correctly due to incorrect routing configuration

## Root Cause

The error occurred because the `runtime` format `nodejs20.x` in the `functions` section was not recognized by Vercel. Vercel expects either:
1. Auto-detection (no explicit runtime, relies on `engines` in `package.json`)
2. Correct runtime format: `vercel/node@20.x` or `@vercel/node@20.x` (not `nodejs20.x`)

## Solution (FINAL - WORKING)

### Fix 1: Runtime Detection
**Removed `functions` section entirely** - rely on Vercel's auto-detection:
- Vercel automatically detects Node.js runtime for files in `api/` directory
- No explicit runtime specification needed for official Node.js runtime
- Keep `engines` field in `package.json`: `"node": "20.x"` (specific version, not range)

### Fix 2: Output Directory
**Added `outputDirectory: "public"` and updated build command**:
- Set `outputDirectory: "public"` in `vercel.json`
- Updated build command to copy files: `"build": "mkdir -p public && cp -r src/frontend/* public/ && echo '✅ Build completed'"`
- Vercel expects static files in `public/` directory after build

### Fix 3: Routing Configuration
**Simplified rewrites** - Vercel serves files from `public/` automatically:
- API routes: `"/api/:path*"` → `"/api/index.js"` (serverless function)
- SPA catch-all: `"/:path*"` → `"/index.html"` (for client-side routing)
- Static files (HTML, CSS, JS) are served automatically from `public/` - no rewrites needed

**What Didn't Work**:
- `"runtime": "nodejs20.x"` - Invalid format
- `"runtime": "@vercel/node"` - Still triggered error
- `"runtime": "vercel/node@20.x"` - Not needed for official runtimes
- Any `functions` section with `runtime` key - Causes the error

**Key Learning**: For official Node.js runtime, DO NOT specify `runtime` in `functions` section. Vercel auto-detects based on file location (`api/` directory) and `engines` in `package.json`.

## Context Files Updated

- ✅ `vercel.json`:
  - Removed `functions` section (let Vercel auto-detect Node.js runtime)
  - Added `outputDirectory: "public"`
  - Simplified rewrites (API route + SPA catch-all)
- ✅ `package.json`:
  - Updated `engines` field from `">=18.0.0"` to `"20.x"` for specific version
  - Updated `build` script to copy files from `src/frontend/` to `public/`
  - Updated Jest dependencies to reduce deprecated warnings
- ✅ `public/` directory created (with `.gitkeep` to keep in git)
- ✅ `ai-context/04-DEV-TEST.md` - Updated with complete Vercel configuration

## Result

✅ **Deployment Successful** - All issues resolved:
- Runtime auto-detected correctly (no `functions` section needed)
- Build process copies static files to `public/` directory
- Static files served correctly from `public/`
- API routes working via serverless function
- SPA routing working via catch-all rewrite

## Prevention Strategy

1. **Runtime Configuration**:
   - Use `engines` field in `package.json` for Node.js version (recommended by Vercel)
   - **DO NOT** add `functions` section with `runtime` - causes "Function Runtimes must have a valid version" error
   - Vercel auto-detects Node.js for files in `api/` directory

2. **Build Process**:
   - Always set `outputDirectory: "public"` in `vercel.json` when using static files
   - Build command must copy/create files in `public/` directory
   - Vercel expects `public/` directory to exist after build completes

3. **Routing**:
   - Use `rewrites` (not `routes`) for routing configuration
   - Static files in `public/` are served automatically - no rewrites needed
   - Only need rewrites for API routes and SPA catch-all

## Key Learnings

- **Runtime**: Vercel auto-detects Node.js from `api/` directory + `engines` in `package.json`. DO NOT specify `runtime` in `functions` section.
- **Output Directory**: When using `outputDirectory: "public"`, build command must create/copy files to `public/` directory.
- **Static Files**: Files in `public/` are served automatically. Only need rewrites for API routes and SPA routing.
- **Build Command**: Must actually create the output directory structure, not just echo a message.
- **Deprecated Warnings**: npm deprecated warnings from transitive dependencies (like Jest) are non-critical and can be ignored.

