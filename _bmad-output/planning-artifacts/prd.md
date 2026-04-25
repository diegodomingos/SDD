---
stepsCompleted: ["step-01-init", "step-02-discovery", "step-02b-vision", "step-02c-executive-summary", "step-03-success", "step-04-journeys", "step-05-domain", "step-06-innovation", "step-07-project-type", "step-08-scoping", "step-09-functional", "step-10-nonfunctional", "step-11-polish", "step-12-complete"]
inputDocuments:
  - "_bmad-output/planning-artifacts/product-brief-SDD-distillate.md"
  - "_bmad-output/planning-artifacts/product-brief-SDD.md"
briefCount: 2
researchCount: 0
brainstormingCount: 0
projectDocsCount: 0
workflowType: 'prd'
classification:
  projectType: desktop_app
  domain: general
  complexity: medium
  projectContext: greenfield
---

# Product Requirements Document — Employee Competence Evaluation Tool

**Author:** Diego
**Date:** 2026-04-16

## Executive Summary

The Employee Competence Evaluation Tool is a proof-of-concept desktop application for single-manager use that automates the most time-consuming part of competency reviews: translating a year of employee observations into structured, evidence-backed grades.

Instead of reconstructing twelve months of employee behavior from memory at review time, managers log observable situations as they occur — each entry tagged to one or more of four competencies (Communication, Client Focus, Proactivity, Teamwork) and tied to the employee's level (A/B/C/D). When evaluation season arrives, the accumulated log is filtered by competency and submitted to an AI evaluation engine that compares the evidence against the configured expected behaviors for that level. The output is a structured grade: *Does Not Meet Expectations*, *Meets Expectations*, *Exceeds Expectations*, or *Insufficient Input* when the evidence base is too thin to support a judgment.

The PoC goal is to validate that continuous, structured behavioral logging enables the system to generate accurate, meaningful grades automatically — reducing evaluation effort significantly and producing a result the manager can stand behind. A successful PoC establishes the foundation for integration into the company's existing HR system.

A secondary benefit: because grades are grounded in logged evidence, managers have a ready-made record to support evaluation conversations when employees ask questions about their results.

**Target user:** A single people manager responsible for periodic competency evaluations across multiple employees at different levels.

### What Makes This Special

Most performance tools address evaluation as a form-filling exercise at year-end. This tool addresses the upstream problem: without a structured log of behaviors captured throughout the year, automated grading has nothing meaningful to work with. The core design bet is that *continuous logging enables automatic grading* — shifting the manager's effort from one painful annual exercise to small, frequent observations.

Three design decisions reinforce this:

- **AI as analyst, not author:** The AI compares real logged evidence against defined behavioral standards and surfaces a grade. It does not write evaluations. The manager logs; the system grades.
- **Insufficient Input as a first-class outcome:** When evidence is sparse, the system returns *Insufficient Input* rather than forcing a false grade — signaling the manager to log more before committing.
- **Configurable framework:** Expected behaviors per competency per level live in the system and can be updated by the manager without technical intervention.

### Project Classification

| Attribute | Value |
|---|---|
| Project Type | Desktop application (React + Node.js, local, single machine) |
| Domain | General — internal HR tooling, no regulated compliance requirements |
| Complexity | Medium — straightforward CRUD baseline with AI evaluation component (Claude API, Anthropic) |
| Project Context | Greenfield — new build, no existing codebase |

## Success Criteria

### User Success

- A manager completes a full evaluation cycle (behavior logging → competency review → AI-generated grade + rationale) for at least one employee without external assistance or technical intervention.
- The AI output — a structured grade paired with a text explanation grounded in the comparison between logged behaviors and the employee's expected behaviors for their level — is reviewed by the manager and accepted as a useful, trustworthy starting point rather than discarded.
- The *Insufficient Input* signal is acted upon: when evidence is sparse, the manager logs additional behaviors before finalizing the evaluation rather than proceeding with an incomplete record.
- The competency framework (expected observable behaviors per competency per level) can be configured and updated by the manager through manual entry without any technical help.

### Business Success

- At least one manager who tested the system reports that it meaningfully improved or simplified their evaluation process.
- Director-level stakeholders, upon receiving positive feedback from testing managers, decide the concept is worth integrating into the existing HR system.

### Technical Success

- The AI evaluation engine produces both a grade and a written rationale for every assessment, explicitly referencing the comparison between logged behavioral evidence and the expected behaviors for the employee's level.
- *Insufficient Input* is returned correctly when logged evidence is too sparse to support a grade — no false or forced grades.
- Local data persists reliably across sessions with no data loss.
- The application runs on a single machine without server infrastructure or authentication.

### Measurable Outcomes

- At least one complete evaluation cycle completed per manager testing the system.
- AI-generated grades are reviewed by testing managers and not rejected as arbitrary or unfounded.
- The competency framework is successfully updated at least once by a non-technical user during the PoC.

## Product Scope & Development Strategy

### MVP Strategy

**Approach:** Problem-solving MVP — validate a single hypothesis: *does continuous, structured behavioral logging produce AI-generated grades that a manager trusts?* Every feature in the MVP exists to make that validation possible.

**Resource:** Solo developer (Diego) on the core application, with a separate team member handling AI integration in parallel.

**Timeline:** No fixed deadline. Prioritize getting the core application testable as early as possible; AI integration joins when ready.

### MVP Feature Set (Phase 1)

**Core user journeys supported:** All four mapped journeys (framework setup, behavior logging, evaluation cycle, insufficient input handling).

| Capability | Rationale |
|---|---|
| Employee management (add/edit, assign level A/B/C/D) | No evaluation is possible without registered employees |
| Competency framework management (manual entry per competency per level) | AI has nothing to compare against without this |
| Behavior logging (free-text, competency tags, date input, multi-tag, retroactive) | No evidence base without logging |
| Evaluation view with competency filter | Core of the hypothesis being tested |
| AI assessment (Claude API) → grade + written rationale | The output that managers will evaluate for trust |
| Insufficient Input as explicit outcome with explanation | Non-negotiable — forces honest evidence collection |
| Local SQLite storage | Data must persist between sessions |
| Electron packaging (Windows installer) | PoC must be installable by non-technical testers |
| Claude API key configuration | Required for each tester to use the AI feature |

### Post-MVP Features

**Phase 2 — Growth (if PoC succeeds):**
- Basic evaluation summary export or clipboard copy — enables managers to share results with directors without screenshots
- UI/UX polish to demo-quality standard for director-level presentations

**Phase 3 — Vision (if HR integration is approved):**
- Integration with company HR system
- Multi-manager support with shared competency framework
- Cross-cycle trend analysis and longitudinal reporting
- Authentication and access control

### Risk Mitigation

| Risk | Likelihood | Mitigation |
|---|---|---|
| Claude API doesn't reliably return structured grade + rationale | Medium | AI workstream validates prompt design independently before integration; mock provider keeps core app testable in the meantime |
| *Insufficient Input* threshold is inconsistent | Medium | Define explicit guidelines in the prompt; test with sparse and rich evidence sets during AI workstream |
| Electron packaging complexity blocks distribution | Low | Use `electron-builder` with standard config; well-documented for React/Node.js stacks |
| SQLite data corruption or loss | Low | Store in `app.getPath('userData')`; consider a simple manual backup export in Growth phase |

**PoC validation risk:** The PoC proves the technology, but manager adoption requires a behavior change — logging continuously throughout the year rather than at review time. The PoC succeeds if even one manager completes a full evaluation cycle and validates AI output quality. That is sufficient to demonstrate the concept to directors.

### Build Sequence (Parallel Workstreams)

**Workstream A — Core Application (Diego):**
1. Data model + SQLite schema (employees, competencies, expected behaviors, behavior log entries)
2. Competency framework management UI
3. Employee management UI
4. Behavior logging UI
5. Evaluation view UI — wired to mock AI provider returning fixed grades + rationale text
6. Electron packaging

**Workstream B — AI Integration (separate team member):**
1. Design and iterate on the Claude API prompt (input: behaviors + expected behaviors → output: structured grade + rationale + Insufficient Input handling)
2. Implement `AIProvider` interface with Claude API
3. Validate output quality against real behavioral data
4. Hand off the `AIProvider` implementation for drop-in integration into Workstream A

**Integration point:** When Workstream B delivers a validated `AIProvider` implementation, Diego replaces the mock with the real one. If both streams move at similar pace, the app is testable end-to-end with real AI output early. If AI takes longer, the rest of the app remains fully testable in the meantime.

## User Journeys

### Journey 1: First Use — Setting the Stage

**Marco** is a people manager responsible for five employees across levels A through D. It's the start of a new evaluation cycle. Until now, he's kept a running notes document — a mix of observations, meeting summaries, and the occasional reminder to himself — but come review time it's always the same scramble: digging through months of text trying to reconstruct who did what and whether it was good enough.

He opens the tool for the first time.

His first task is the competency framework. He navigates to the configuration area and, competency by competency, types in the expected observable behaviors for each level — copying from the document his organization already uses as the standard. It takes some time, but it's a one-time setup. By the end, the tool knows exactly what *Proactivity at Level B* looks like, what *Client Focus at Level D* demands.

Then he registers his employees: names and assigned levels. Five entries. Done.

He closes the tool. There's nothing to log yet — the year has just started. But the stage is set. The next time something worth noting happens, he'll have somewhere structured to put it.

**Capabilities revealed:** Competency framework management (create/edit expected behaviors per competency per level); employee management (add employees, assign level).

---

### Journey 2: The Logging Habit — Capturing Evidence at the Moment It Counts

Three months into the year. A team member named Sofia — Level B — steps in to help a client resolve an issue that was technically outside her scope. Marco notices. He makes a mental note.

That evening, he opens the tool and logs the observation: *"Sofia proactively helped resolve client issue outside her direct responsibility, reducing escalation risk."* He tags it to **Proactivity** and **Client Focus**. The date is pre-filled to today, but he could adjust it if he'd noticed the behavior yesterday and is logging it now.

Two weeks later, a colleague tells Marco about something one of his other reports, João, did in a meeting Marco didn't attend. Marco logs it with the actual date of the meeting — a few weeks back. The system accepts it without complaint.

By mid-year, Marco has dozens of entries. Some employees have rich logs across multiple competencies. A few have sparse coverage in areas where nothing notable has happened — or nothing that Marco caught.

**Capabilities revealed:** Behavior logging (free-text description, competency tag(s), date input including retroactive dates, multi-competency tagging per entry).

---

### Journey 3: Evaluation Time — From Log to Grade

It's review season. Marco opens the tool and selects Sofia.

He navigates to the evaluation view and filters her log by **Proactivity**. Six entries surface — specific situations, dates, his own words. He reads through them. This is the first time he's seen them all together, and they tell a coherent story.

He triggers the AI assessment. The system compares Sofia's logged behaviors against the expected behaviors for a Level B employee in Proactivity. A few seconds later, the result appears:

**Meets Expectations**

Below the grade, a short paragraph: *"Sofia's logged behaviors consistently demonstrate initiative within her role. Three entries show unprompted action to prevent client escalations. Two entries reflect cross-team collaboration. No logged behaviors contradict the expected standard for Level B. Evidence base is sufficient."*

Marco reads the rationale. He agrees. He moves to the next competency.

**Capabilities revealed:** Evaluation view (filter by competency, trigger AI assessment, display grade + written rationale grounded in logged evidence vs. expected behaviors).

---

### Journey 4: Edge Case — Insufficient Input

Marco now evaluates João across all four competencies. Logging → reviewing → grading goes smoothly for three of them.

He reaches **Teamwork**. He filters João's log. Two entries. Both from the same month, both thin on detail.

He triggers the AI assessment. The result:

**Insufficient Input**

Rationale: *"Only two behavioral entries are tagged to Teamwork, both from a single period. The evidence base is too sparse to support a reliable comparison against the expected behaviors for Level C. Additional observations are needed before a grade can be assigned."*

Marco pauses. He hasn't been watching for teamwork behaviors intentionally. He thinks back over the year — there was a project where João played a coordinating role. He logs two more entries retroactively, dating them correctly. He triggers the assessment again. This time, a grade comes back.

The *Insufficient Input* outcome didn't fail him — it told him exactly what to do.

**Capabilities revealed:** Insufficient Input as a first-class evaluation outcome; AI rationale that explains what's missing; support for retroactive logging as a recovery action.

---

### Journey Requirements Summary

| Capability | Revealed By |
|---|---|
| Competency framework management (create/edit per competency per level) | Journey 1 |
| Employee management (add, assign level) | Journey 1 |
| Behavior logging (free-text, competency tags, date input, multi-tag support) | Journeys 2, 4 |
| Retroactive date entry for behavior logs | Journeys 2, 4 |
| Evaluation view with competency filter | Journey 3 |
| AI assessment trigger per competency per employee | Journeys 3, 4 |
| Grade display (4-value scale) | Journeys 3, 4 |
| AI-generated written rationale alongside grade | Journeys 3, 4 |
| Insufficient Input as explicit, explained outcome | Journey 4 |

## Innovation & Novel Patterns

### Detected Innovation Areas

**AI as a Constrained Analytical Engine**

The central innovation is not the use of AI, but *how* the AI is constrained to operate. Most AI-assisted tools in the HR space generate free-form narrative evaluations or apply generic scoring rubrics. This tool does neither.

The AI receives exactly two inputs:
1. A set of logged behavioral observations specific to one employee and one competency
2. The expected observable behaviors defined for that employee's level in that competency

Its sole task is to compare these inputs and return a structured judgment. It does not write narrative evaluations, infer behaviors that weren't logged, or extrapolate from adjacent evidence. Every grade is traceable to specific logged behaviors — the AI didn't invent anything.

**Insufficient Input as a First-Class Outcome**

When the evidence base is too sparse to support a reliable comparison, the system returns *Insufficient Input* rather than forcing a grade. This is not an error state — it is a valid evaluation outcome. By surfacing this explicitly, the system builds trust rather than eroding it, and prompts the manager toward better logging behavior rather than accepting a false result.

### Validation Approach

The PoC itself is the validation. The innovation is considered validated when:
- Testing managers find AI-generated grades and rationales trustworthy and grounded
- The *Insufficient Input* signal is acted upon rather than dismissed
- No grade is perceived as arbitrary or disconnected from the logged evidence

### Innovation Risk Mitigation

| Risk | Mitigation |
|---|---|
| AI returns confident grade despite sparse evidence | *Insufficient Input* threshold enforced in prompt design; grade output blocked without minimum evidence check |
| AI rationale references behaviors not in the log | Prompt constrains AI to only cite provided input; no inference or extrapolation allowed |
| AI provider change invalidates prompt design | Prompt logic and constraints documented as a product artifact, not embedded informally in code |

## Desktop Application Requirements

### Application Framework

- **Framework:** Electron — integrates natively with the React + Node.js stack, supports cross-platform builds from a single codebase, no backend language changes required.
- Electron's main process handles Node.js logic (database access, AI API calls); the renderer process hosts the React frontend.

### Database

- **Database:** SQLite via `better-sqlite3` — zero configuration, runs as a single file, no daemon or server process required.
- Database file stored in `app.getPath('userData')` to survive application reinstalls.

### AI Provider

- **Provider:** Claude API (Anthropic)
- **Model:** Claude Haiku 4.5 (speed and cost); Claude Sonnet 4.6 as upgrade path if output quality requires it.
- AI calls made at evaluation time only — one call per competency per employee assessment.
- The AI service is abstracted behind an `AIProvider` interface so the underlying model or provider can be swapped without restructuring application logic.
- Cost for PoC usage is negligible (fractions of a cent per full evaluation cycle).
- AI evaluation requires an active internet connection. On call failure, the UI must display a clear, actionable error — not a silent failure.

### Platform Support

| Platform | Priority | Notes |
|---|---|---|
| Windows | Primary | Target environment for testing managers |
| macOS | Nice-to-have | Supported by Electron without extra effort |
| Linux | Nice-to-have | Supported by Electron without extra effort |

### System Integration

None in v1. Fully standalone — no HR system integration, no file system dependencies beyond the app data directory.

### Update Strategy

No auto-update for the PoC. Distribution is manual — share the installer directly with testing managers. If the PoC advances, `electron-updater` should be considered.

### Offline Capabilities

All functionality is offline except AI evaluation calls, which require internet access to reach the Claude API. If the AI call fails due to connectivity, the application displays a clear error; all other features remain available.

### Implementation Considerations

- **Installer:** `electron-builder` producing `.exe` (NSIS) for Windows, `.dmg` for macOS.
- **Data location:** SQLite database at `app.getPath('userData')`.
- **AI abstraction:** `AIProvider` interface in Node.js backend. Claude API satisfies this interface for v1; a local model (e.g., Ollama) could satisfy the same interface as a future fallback.
- **API key management:** Claude API key configurable by the user, stored via Electron's `safeStorage` API — never hardcoded.

## Functional Requirements

### Employee Management

- **FR1:** Manager can add a new employee with a name and assigned competency level (A/B/C/D).
- **FR2:** Manager can edit an existing employee's name or assigned level.
- **FR3:** Manager can view a list of all registered employees.
- **FR4:** Manager can remove an employee from the system.

### Competency Framework Management

- **FR5:** Manager can view the four fixed competency dimensions (Communication, Client Focus, Proactivity, Teamwork).
- **FR6:** Manager can configure expected observable behaviors for each competency at each level (A/B/C/D).
- **FR7:** Manager can edit existing expected observable behaviors.
- **FR8:** Manager can view all configured expected behaviors organized by competency and level.

### Behavior Logging

- **FR9:** Manager can create a behavior log entry with a free-text description of an observed situation.
- **FR10:** Manager can tag a behavior log entry to one or more competencies.
- **FR11:** Manager can associate a behavior log entry with a specific employee.
- **FR12:** Manager can set the date of a behavior log entry, including dates in the past (retroactive logging).
- **FR13:** Manager can view all behavior log entries for a given employee.
- **FR14:** Manager can filter behavior log entries by competency for a given employee.
- **FR15:** Manager can edit an existing behavior log entry.
- **FR16:** Manager can delete a behavior log entry.

### AI Evaluation

- **FR17:** Manager can trigger an AI assessment for a specific employee and competency.
- **FR18:** System displays an AI-generated grade for a triggered assessment. Valid grades: *Does Not Meet Expectations*, *Meets Expectations*, *Exceeds Expectations*, *Insufficient Input*.
- **FR19:** System displays an AI-generated written rationale alongside the grade, explicitly grounded in the comparison between the employee's logged behaviors and the expected behaviors for their level.
- **FR20:** System returns *Insufficient Input* with an explanation when logged evidence is too sparse to support a reliable grade.
- **FR21:** System confines AI assessment to logged behavioral evidence only — the AI does not infer, extrapolate, or reference information not present in the provided input.
- **FR22:** Manager can re-trigger an AI assessment for the same employee and competency after adding new behavior log entries.
- **FR23:** System displays a clear, actionable error message when an AI assessment fails due to connectivity or API issues.

### Application Configuration

- **FR24:** Manager can configure the Claude API key used for AI assessments.
- **FR25:** System stores the API key securely on the local machine.

### Data Persistence

- **FR26:** System persists all data locally across application sessions without requiring internet connectivity.
- **FR27:** System stores data in a location that survives application reinstalls.

## Non-Functional Requirements

### Performance

- All local operations (logging, browsing, framework editing, employee management) complete within **1 second** under normal conditions.
- AI assessment calls complete within **15 seconds** under normal network conditions. The UI must display a loading state during the call.
- AI calls exceeding **30 seconds** time out gracefully with an actionable error message.

### Security

- The Claude API key is stored using OS-level secure storage (Windows Credential Manager via Electron's `safeStorage` API) — never in plaintext in config files, logs, or environment variables accessible outside the app.
- The API key does not appear in application logs, error messages, or any UI element beyond the configuration screen.
- Local employee and behavioral data is protected by OS-level user account access control. No additional encryption is required for the PoC's single-user, single-machine deployment.

### Reliability

- All data writes are atomic — a crash mid-operation must not leave the database in a corrupt or partial state. SQLite transactions enforce this by default.
- Failed AI calls do not corrupt application state. A failed assessment leaves the behavior log intact; the manager can retry without data loss.
- The application starts successfully when the Claude API is unreachable — all non-evaluation features remain available offline.
