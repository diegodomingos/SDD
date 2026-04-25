---
title: "Product Brief Distillate: Employee Competence Evaluation Tool"
type: llm-distillate
source: "product-brief-SDD.md"
created: "2026-04-15"
purpose: "Token-efficient context for downstream PRD creation"
---

# Product Brief Distillate: Employee Competence Evaluation Tool

## Product Identity

- **Full name:** Employee Competence Evaluation Tool
- **Type:** Internal proof-of-concept desktop application
- **Goal of PoC:** Validate the core workflow independently before proposing integration into the company's existing HR system
- **Project folder:** SDD (local name only, not the product name)

---

## Technical Context

- **Stack:** React (frontend) + Node.js (backend) + simple local database
- **DB preference:** MongoDB or MySQL — whichever is simpler on the React/Node stack; user is open to recommendation
- **Deployment:** Local desktop app, single machine, single user (no server, no auth, no multi-tenancy)
- **Data storage:** Local only — data portability across machines is a known limitation accepted for PoC phase
- **AI component:** Provider not yet decided — options include Claude API, OpenAI API, or local model; needs decision before implementation. Consideration: employee behavior data may be sensitive — data privacy implications of cloud AI providers worth flagging in architecture

---

## Domain Model (core entities)

- **Employee:** name, assigned level (A / B / C / D)
- **Competence:** one of four fixed dimensions — Communication, Client Focus, Proactivity, Teamwork
- **Expected Observable Behavior:** per competence × per level — configurable by the manager in the system (not hardcoded)
- **Behavior Log Entry:** free-text situation description + one or more competence tags + date
- **Evaluation:** per employee, per competence — AI-generated grade from: Does Not Meet Expectations / Meets Expectations / Exceeds Expectations / Insufficient Input

---

## Features — Confirmed MVP Scope

1. **Employee management** — add/edit employees, assign level (A/B/C/D)
2. **Competence framework management** — configure expected observable behaviors per competence per level; manager-editable, no technical intervention required
3. **Behavior logging** — free-text situation + competence tag(s) + date; manager enters manually throughout the year
4. **Evaluation view** — filter behavior log by competence; trigger AI assessment; display graded output per competence

---

## Features — Explicitly Out of Scope for v1

- Multi-manager or multi-tenant support
- Employee self-logging or self-evaluation
- Integration with existing HR system (future vision, not PoC)
- Authentication / access control
- Analytics dashboards or historical trend reporting
- Mobile or web deployment
- Export / report generation *(open question — see below)*

---

## Behavior & Edge Cases

- **Insufficient Input:** When logged evidence is too sparse for a competence, AI must return "Insufficient Input" rather than forcing a grade — this is a first-class output, not an error state
- **Multiple competence tags per entry:** A single behavior log entry can be tagged to more than one competence (e.g., an action that demonstrates both Proactivity and Client Focus)
- **AI role:** Comparative/analytical only — maps logged evidence against expected behaviors for the employee's level; does not generate freeform text evaluations

---

## Users

- **Only user type:** Manager (single role, no employee-facing interface, no admin role)
- **Workflow rhythm:** Logs behaviors throughout the year as they occur; uses the evaluation view at review time

---

## Existing Assets

- Diego has a document containing the expected observable behaviors per competence per level — this can seed the initial competence framework data. Consider supporting an import or pre-load mechanism to reduce onboarding friction.

---

## Open Questions (unresolved during discovery)

1. **AI provider:** Which AI service/model will power the behavior-to-standard comparison? (Claude API, OpenAI, local model?) — affects data privacy, cost, and offline capability
2. **Export / shareable output:** Should v1 include a basic "evaluation summary" view or clipboard export? Low effort, high value for pitching to HR stakeholders — deferred but not rejected
3. **Competence framework seeding:** Should the system support importing the existing expected-behaviors document, or is manual entry acceptable for PoC?
4. **Database choice:** MongoDB vs. MySQL (or SQLite?) — recommend deciding based on simplest local desktop setup for React/Node

---

## Strategic Context

- This is a **PoC**, not a production product — the evaluation audience is internal HR stakeholders who need to be convinced the concept is worth integrating
- The core value proposition tested by the PoC: does continuous, structured behavioral logging meaningfully improve evaluation quality vs. year-end recall?
- Integration with the company HR system is the explicit long-term goal if the PoC succeeds
- Pain being solved: recall bias + evidence gaps + evaluation inconsistency in annual competence reviews

---

## Rejected / Deferred Ideas (do not re-propose for v1)

- **Employee self-evaluation / self-logging** — explicitly out of scope; manager-only tool
- **Multi-manager support** — deferred; PoC is single-manager by design
- **360-degree feedback** — not mentioned; outside stated scope
- **HR system integration in v1** — vision only; PoC must be standalone and testable independently
