# Start Here

## What This Repository Is

This is an autonomous application repository created by Control Tower.

It contains:
- **Application code** (to be implemented)
- **AI-context** - All context needed for stateless AI agents
- **Sprint system** - Task planning and tracking
- **Retro system** - Process improvement and learning
- **Debug tracking** - Debugging sessions and code investigations

## Reading Order for Agents

If you are an AI agent operating this repository:

1. **Read this file first** (`00-START-HERE.md`)
2. **Read `01-DESIGN.md`** - Understand the MVP design and scope
3. **Read `02-RULES.md`** - Understand the rules you must follow
4. **Read `03-REPO-MAP.md`** - Understand the repository structure
5. **Read `04-DEV-TEST.md`** - Understand how to run and test
6. **Read `05-DECISIONS.md`** - Understand past architectural decisions
7. **Read `06-TESTING-PATTERNS.md`** - Understand established testing patterns (if exists)

Then proceed to `MASTER_PROMPT.md` to understand your operating model.

## Where Sprint Plans Live

Sprint plans are in the `sprints/` directory:

- `sprints/00-sprint-plan.md` - Overview of all sprints
- `sprints/sprint-01.md` - First sprint tasks and status
- `sprints/sprint-02.md` - Second sprint (if exists)
- etc.

**Always check the sprint plan before starting work.**

## Where Retros Live

Retrospectives are in the `retro/` directory:

- `retro/latest.md` - Latest retro summary and learnings
- `retro/sprint-01.md` - Retro for sprint 01
- `retro/sprint-02.md` - Retro for sprint 02 (if exists)
- `retro/evaluation-*.md` - Evaluation retros (if exists)
- etc.

**Update retros after completing sprints. Use evaluation mode to analyze patterns across sprints.**

## Where Debug Sessions Live

Debug sessions are in the `debug/` directory:

- `debug/debug-YYYY-MM-DD-<summary>.md` - Individual debug sessions
- `debug/README.md` - Debug session documentation

**Debug sessions track issues, questions, and code investigations. Important findings feed back into design, decisions, and sprints.**

## Development Workflow Cycle

The development process follows this cycle:

**Develop → Debug → Retro → Develop**

### 1. Develop
- Work on sprint tasks
- Implement features with tests
- Update sprint status

### 2. Debug (when needed)
- Investigate issues or answer questions
- Document findings in `debug/debug-*.md`
- Update ai-context files immediately (design, decisions, documentation)
- Add prevention tasks to sprints

### 3. Retro (after sprint completion)
- **Gather all debug sessions** from the sprint
- **Review and propagate** debug findings to ai-context:
  - Ensure all design learnings are in `01-DESIGN.md`
  - Ensure all architectural learnings are in `05-DECISIONS.md`
  - Ensure all documentation is updated
- **Adjust sprint plans** based on learnings:
  - Add prevention tasks
  - Adjust priorities
  - Update acceptance criteria
- Document what went well and poorly
- Update `retro/latest.md` with key learnings

### 4. Develop (with updated context)
- Start next sprint with updated ai-context
- Benefit from propagated debug findings
- Use improved sprint plans

**Key Point**: The retro process ensures debug findings are systematically propagated into ai-context and sprint plans, creating a feedback loop that improves future development.

## How Agents Should Operate

### One Task Per Session

- Work on **one task** at a time
- Tasks come from sprint files
- Update sprint status when complete
- Don't start new tasks until current one is done

### Stateless Operation

- **Every session starts fresh** - no conversation memory
- **All context is in files** - read `ai-context/` first
- **Update files** when you make changes that affect context

### Mandatory Testing

- Every feature must have tests
- Tests are part of acceptance criteria
- Run tests before marking task complete

### Mandatory Updates

When you make changes:
- **Structure changes** → Update `03-REPO-MAP.md`
- **Design changes** → Update `01-DESIGN.md`
- **New decisions** → Update `05-DECISIONS.md`
- **Sprint complete** → Run retro process to gather debug findings and propagate to ai-context

## Key Principles

- **MVP first**: Stay within MVP scope (see `01-DESIGN.md`)
- **Stateless agents**: All context in files
- **AI-context is source of truth**: If it's not documented, it doesn't exist
- **Retro-driven improvement**: Learn from each iteration
- **Debug findings propagated**: Retro process ensures debug findings flow into ai-context and sprint plans
- **Feedback loop**: Develop → Debug → Retro → Develop cycle continuously improves context
- **Evaluation mode**: Periodically analyze retros to improve process and structure

## Boundaries

- **This app is autonomous** - Control Tower created it, but you operate it independently
- **NEVER edit Control Tower** - You cannot modify files in `control-tower/` or `../control-tower/` for any reason
- **NEVER edit templates** - You cannot modify files in `templates/` or `../templates/` for any reason
- **NEVER edit project types** - You cannot modify files in `project-types/` or `../project-types/` for any reason
- **Control Tower suggestions** - Suggestions for Control Tower improvements are compiled during Evaluation/Retro Mode, not during regular development or sprint retros

## Getting Started

1. Read all `ai-context/` files
2. Check `sprints/00-sprint-plan.md` for current sprint
3. Read the active sprint file
4. Pick one task
5. Implement with tests
6. Update sprint and retro

That's it. One task at a time.

