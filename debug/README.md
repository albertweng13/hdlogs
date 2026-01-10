# Debug Sessions

This directory tracks debugging sessions and code investigations.

## Purpose

Debug sessions document:
- Issues encountered and how they were resolved
- **What context files were updated** to prevent recurrence (primary focus)
- **What tasks were added to sprints** to prevent similar issues
- Prevention strategies

**Focus**: Feed findings back to design, decisions, and sprints - not verbose logging of the debugging process.

## How to Use

### Starting a Debug Session

1. **User requests debugging mode** in the application
2. **Agent creates** a new debug session file: `debug-YYYY-MM-DD-<issue-summary>.md`
3. **Agent documents** the investigation, solution, and learnings
4. **Agent updates** context files if findings warrant it
5. **Agent adds** follow-up tasks to sprints if needed

### Debug Session Files

Each debug session is a markdown file with:
- Issue/question description
- Investigation process
- Root cause or answer
- Solution or explanation
- Context updates made
- Follow-up tasks
- Key learnings

### Feeding Back to Context

Important debugging findings should update:
- **Design** (`ai-context/01-DESIGN.md`) - If design assumptions were wrong
- **Decisions** (`ai-context/05-DECISIONS.md`) - If patterns should be adopted/avoided
- **Sprints** (`sprints/`) - If follow-up work is needed
- **Retro** (`retro/latest.md`) - If process improvements are needed

## File Naming

Debug session files are named: `debug-YYYY-MM-DD-<issue-summary>.md`

Examples:
- `debug-2024-12-23-authentication-error.md`
- `debug-2024-12-23-understanding-api-structure.md`
- `debug-2024-12-24-database-connection-issue.md`

## Template

See `debug-template.md` for the debug session template structure.

---

**Debug sessions help retain context and prevent recurring issues.**

