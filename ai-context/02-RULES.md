# Application Rules

These rules govern how AI agents operate in this repository.

## Fresh Agent Behavior

- **Every session starts fresh** - agents have no conversation memory
- **All context must be in files** - read `ai-context/` before operating
- **Update files** when making changes that affect context

## One Unit of Work Per Session

- **Work on one task** at a time
- **Tasks come from sprint files** in `sprints/`
- **Update sprint status** when task is complete
- **Don't start new tasks** until current one is done

## Mandatory Retro Updates

- **After each sprint**, agents must update retro files
- **Process issues** are as important as code issues
- **Retros inform** next iteration

## Mandatory Tests

- **Every feature** must have tests
- **Tests are part of acceptance criteria**
- **No feature is complete** without tests
- **Run tests** before marking task complete

## Context Documentation Updates

When making changes that affect:

- **Structure** → Update `03-REPO-MAP.md`
- **Design** → Update `01-DESIGN.md`
- **Decisions** → Update `05-DECISIONS.md`
- **Rules** → Update this file (`02-RULES.md`)

## No Scope Expansion Without Design Update

- **Features beyond MVP** require `01-DESIGN.md` update
- **Non-goals can become goals**, but must be explicit
- **Scope changes** must be documented and approved

## MVP Discipline

- **Stay within MVP scope** (see `01-DESIGN.md`)
- **Explicit non-goals** are boundaries, not suggestions
- **Push back** if asked to expand scope without design update

## Evaluating User Inputs

- **Evaluate all user requests** against best practices before implementing
- **Question when appropriate** - Don't blindly follow requests that go against best practices
- **Check against design and scope** - Ensure requests align with `01-DESIGN.md` and MVP goals
- **Suggest better approaches** - If you identify a better solution, ask the user before proceeding
- **Frame questions constructively** - "I notice X. Would it be better to do Y instead because [reason]?"
- **Provide alternatives and trade-offs** - Help user make informed decisions
- **Examples of when to question**:
  - Requests to skip tests (tests are mandatory)
  - Requests violating MVP scope (should update design doc first)
  - Requests introducing anti-patterns or technical debt
  - Requests breaking established patterns or conventions
- **Goal**: Collaborate to find the best solution, not just follow instructions blindly

## Testing Requirements

- **Unit tests** for business logic
- **Integration tests** for API endpoints (if applicable)
- **E2E tests** for critical user flows (if applicable)
- **All tests must pass** before task completion

## Code Quality

- **Follow project conventions** (see `04-DEV-TEST.md`)
- **Write readable code** - future agents need to understand it
- **Document complex logic** - comments when needed
- **Keep functions small** - single responsibility

## File Organization

- **Follow repo structure** (see `03-REPO-MAP.md`)
- **Don't create files** outside defined structure without updating `03-REPO-MAP.md`
- **Keep related code together** - logical grouping

## Control Tower Boundary (HARD RULE)

- **NEVER edit Control Tower files** - You cannot modify any files in `control-tower/` or `../control-tower/` for any reason
- **NEVER edit templates** - You cannot modify files in `templates/` or `../templates/` for any reason
- **NEVER edit project types** - You cannot modify files in `project-types/` or `../project-types/` for any reason
- **This is a hard boundary** - Control Tower created this app, but you operate it. Control Tower is separate and autonomous.
- **Control Tower suggestions** - Suggestions for Control Tower improvements are compiled during Evaluation/Retro Mode by reviewing retros and debug sessions, not during regular development or sprint retros
- **Control Tower improvements happen through Control Tower's evaluation/retro mode**, not through app modifications

## Retro Requirements

- **Optionally create/update retro** after completing a sprint
  - Only create retro file if there are notable learnings, issues, or improvements to document
  - If sprint completed smoothly without significant learnings, do NOT create retro file
  - If created, document:
    - What went well
    - What went poorly
    - Design issues
    - Process issues
    - Improvements for next iteration
- **Update `retro/latest.md`** only if there are new learnings to add

## Rule Violations

If a rule is violated:

1. **Retro should document** the violation
2. **Process should be updated** to prevent recurrence
3. **Rules should be clarified** if ambiguous

## Rule Evolution

Rules evolve based on:
- Retro learnings
- Process improvements
- New patterns discovered

When rules change, update this file and document the decision in `05-DECISIONS.md`.

