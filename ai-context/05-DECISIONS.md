# Architectural Decisions

This file documents architectural and process decisions made during development.

Format: Date | Decision | Reason

---

## Initial Decisions (from Control Tower)

**2024-12-XX | Project Type: Sheets-Backed App | Rapid MVP with simple data storage**

Decision: This project uses the Sheets-Backed App project type, using Google Sheets as the backend data store.

Reason: 
- MVP needs to ship quickly without database setup
- Simple CRUD operations (add clients, input workouts, view data)
- Non-technical user (trainer) can edit data directly in sheets if needed
- Data structure is simple (rows/columns) - clients and workouts
- Low to medium data volume expected (< 100 clients, < 1000 workouts)

**2024-12-XX | Single-Page Application | Simplicity for non-technical user**

Decision: All functionality accessible on a single page with no navigation or routing.

Reason:
- User requested single-page for simplicity
- Reduces complexity for non-technical trainer
- Faster interactions (no page reloads)
- Cleaner user experience for MVP

**2024-12-XX | Web Application Platform | Browser-based access**

Decision: Application will be a web application accessible via browser URL.

Reason:
- No installation required
- Accessible from any device with browser
- Easier deployment and updates
- Matches user's platform preference

**2024-12-XX | Google Sheets as Backend | Simple CRUD operations**

Decision: Use Google Sheets API for all data storage (clients and workouts).

Reason:
- Simple CRUD operations sufficient for MVP
- No database setup or maintenance required
- Non-technical user can view/edit data directly in sheets
- Rapid iteration without migrations
- Data portability (export to CSV/Excel easily)

**2024-12-XX | Two-Sheet Structure | Separate sheets for clients and workouts**

Decision: Use two separate Google Sheets tabs: "Clients" and "Workouts".

Reason:
- Clear separation of data types
- Easier to query and manage
- Workouts linked to clients via clientId
- Simpler than single sheet with complex relationships

---

## Development Decisions

**2024-12-XX | Keep Simple Two-Sheet Structure (Not One Tab Per Client) | Simplicity and MVP Focus**

Decision: Maintain the two-sheet structure (Clients sheet + Workouts sheet) instead of creating one tab per client.

Reason:
- Simpler implementation - no tab creation/management complexity
- No Google Sheets tab limits (200 tabs max) to worry about
- Easier to query all workouts if needed in the future
- Trainers can sort the Workouts sheet by `clientId` in Google Sheets UI to view workouts organized by client
- Aligns with MVP principle of keeping things simple
- Native Google Sheets sorting is sufficient for trainer's viewing needs

Alternative considered: One tab per client (first tab = Clients, subsequent tabs = one per client)
- Would provide better visual organization per client
- But adds complexity: tab creation, naming conflicts, tab management
- Not necessary for MVP - sorting achieves the same viewing benefit with less complexity

---

## Decision Categories

Decisions may fall into:
- **Technology choices** - frameworks, libraries, tools
- **Architecture patterns** - how code is organized
- **Process decisions** - how work is done
- **Design decisions** - UI/UX choices
- **Data decisions** - how data is stored/accessed

---

## When to Document a Decision

Document a decision when:
- It affects the architecture or structure
- It's not obvious why a choice was made
- Future agents might question the choice
- It sets a precedent for future work

---

## Decision Evolution

Decisions can be revisited:
- Document the change in a new entry
- Explain why the decision changed
- Update affected code and documentation

---

**This file grows over time. Keep it current.**

