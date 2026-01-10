# Debug Session: Sheet Organization Evaluation

**Date**: 2026-01-07  
**Issue**: User requested changing sheet organization from two-sheet structure (Clients + Workouts) to one tab per client structure.

## Summary

User initially requested changing data organization to create one tab per client (first tab = Clients, subsequent tabs = one per client). After evaluation, we determined that keeping the simple two-sheet structure with Google Sheets sorting is better for MVP.

## Solution

**Decision**: Keep the two-sheet structure. Trainers can sort the Workouts sheet by `clientId` in Google Sheets UI to view workouts organized by client.

**Reasoning**: 
- Simpler implementation (no tab creation/management)
- No tab limits to worry about
- Easier to query all workouts
- Native Google Sheets sorting sufficient for viewing needs
- Aligns with MVP simplicity principle

## Context Files Updated

1. **`SHEET_SETUP.md`** - Added Step 7 with instructions on how to sort Workouts sheet by clientId
2. **`ai-context/03-REPO-MAP.md`** - Added note that trainers can sort Workouts sheet by clientId
3. **`ai-context/05-DECISIONS.md`** - Documented decision to keep simple two-sheet structure instead of one tab per client

## Prevention Strategy

- Decision documented in `05-DECISIONS.md` to prevent future reconsideration without evaluation
- Documentation added to help trainers understand they can sort in Google Sheets
- Future agents will see this decision and understand the reasoning

## Key Learning

Evaluating user requests against MVP principles and simplicity often reveals better solutions than complex implementations. The simpler approach (sorting) achieves the same viewing benefit without added complexity.

