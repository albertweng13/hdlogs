# Latest Retrospective

This file summarizes the latest retrospective learnings and links to sprint-specific retros.

## Retro Philosophy

Retrospectives are **first-class** in this repository. They serve to:

- **Learn from experience** - what worked, what didn't
- **Improve process** - how can we work better
- **Surface issues** - design problems, technical debt
- **Inform next iteration** - what to do differently

## Latest Summary

**Last Updated**: 2026-01-10 (Sprint 01 Retro)

### What Went Well
- Sprint 01 completed successfully with all code tasks done
- Comprehensive test coverage achieved (34/35 unit tests passing, all integration tests created)
- Good error handling improvements after debugging (diagnostic endpoint, better error messages)
- Automatic sheet initialization reduces setup friction
- Decision documentation pattern worked well (two-sheet structure evaluation)

### What Went Poorly
- Server restart requirement discovered late - should have been documented upfront
- Debug findings about server restart weren't immediately propagated to debugging docs (process improvement needed)
- ES module mocking issue in one unit test (non-blocking, but noted)

### Key Improvements
- **Immediate context propagation**: Debug findings should update ai-context files immediately during debugging, not wait for retro
- **Proactive documentation**: Document common setup issues (like server restart requirement) upfront in debugging sections
- **Better error handling**: Improved error messages and diagnostic endpoints help debugging significantly

## Sprint Retros

- [Sprint 01 Retro](./sprint-01.md) - [Status: COMPLETE]

## Evaluation Retros

- [Add evaluations as they are completed]

## Process Learnings

**Last Updated**: 2026-01-10

As retros are completed, aggregate learnings here:

- **Design learnings**: 
  - MVP design held up well during implementation - no design changes needed
  - Evaluating user requests against design principles (like two-sheet vs. one-tab-per-client) leads to better decisions that align with MVP simplicity

- **Process learnings**: 
  - **Critical**: Debug findings should be propagated to ai-context files immediately during debugging, not deferred to retro. This ensures future agents have context right away.
  - Proactive documentation of common issues (like server restart requirement) prevents repeated debugging time
  - Diagnostic tools (like `/api/debug/sheets`) significantly improve debugging experience

- **Technical learnings**: 
  - Environment variables in Node.js are loaded at server startup - server must be restarted after `.env` changes
  - Automatic sheet initialization (creating sheets/headers if missing) reduces setup friction and prevents errors
  - Better error messages that list available sheets help users debug faster

- **Tool learnings**: 
  - Jest ES module mocking can be tricky - one test has a non-blocking issue that may need configuration adjustment
  - Google Sheets API error messages can be cryptic - adding diagnostic information significantly helps debugging

## How to Record Retros

### After Completing a Sprint

**Workflow**: Develop → Debug → Retro → Develop

1. **Gather debug sessions** from `debug/` directory that occurred during this sprint
2. **Run retro process** (see RETRO MODE in MASTER_PROMPT.md):
   - Review all debug sessions
   - **Propagate debug findings to ai-context** (design, decisions, documentation)
   - **Adjust sprint plans** based on learnings (add prevention tasks, adjust priorities)
3. **Optionally create/update** the sprint-specific retro file (e.g., `sprint-01.md`)
   - Only create if there are notable learnings, issues, or improvements to document
   - If sprint completed smoothly without significant learnings, do NOT create retro file
   - **Include "Debug Findings Review" section** (see sprint retro template)
4. **If retro file created**, fill in all sections honestly, including debug findings
5. **Update this file** (`retro/latest.md`) only if there are new learnings to add
6. **Apply** improvements in next sprint (if any)

**Key Point**: The retro process ensures debug findings are systematically propagated into ai-context and sprint plans, creating a feedback loop that improves future development.

### Running an Evaluation

When user requests evaluation/retro mode:

1. **Read all retro files** to gather data
2. **Compile Control Tower suggestions** - Review all retros and identify suggestions for Control Tower improvements
3. **Analyze patterns** and issues
4. **Propose improvements** to process, design, or structure
5. **Implement approved** improvements
6. **Optionally document** in evaluation retro file (e.g., `evaluation-YYYY-MM-DD.md`)
   - Only create if there are findings, improvements made, or significant learnings
   - Include Control Tower suggestions if any
   - If no improvements or findings, do NOT create evaluation file
7. **Update this file** (`retro/latest.md`) only if there are new learnings to add

---

**This file evolves with each sprint. Keep it current.**

**Note**: Only update this file if there are new learnings to add. Do NOT update if there are no notable changes from the sprint.

