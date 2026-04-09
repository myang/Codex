# Harness Engineering Learning Plan + Competency Demo

## 1) Goal and Audience

This plan is for a **senior mobile app developer** who wants to understand harness engineering in practice and present a credible competency demo to management.

**Primary outcome:** build and demonstrate an end-to-end workflow where natural-language intent is transformed into design/code artifacts, then repeatedly evaluated by **automated tests/validators**, and automatically repaired until quality gates pass.

---

## 2) What “Harness Engineering” Means in Practice

Harness engineering is the discipline of building the **control system around generation**:

- Inputs and constraints (intent, policies, architecture rules).
- Task decomposition and deterministic execution.
- Multi-layer validation (unit/integration/e2e, static analysis, security, UX/accessibility checks).
- Automated diagnosis and repair loops.
- Traceability, observability, and release gates.

In short: the harness is the system that makes model output reliable enough for production.

---

## 3) Competency Model (What to Learn)

You should become fluent across five layers:

1. **Specification layer**
   - Intent schema, acceptance criteria, non-functional requirements.
2. **Orchestration layer**
   - Workflow graph/state machine, retries, branching, rollback.
3. **Validation layer**
   - Test pyramid, mutation/property testing, static + runtime policy checks.
4. **Repair layer**
   - Error classification, targeted patch generation, confidence checks.
5. **Release layer**
   - Promotion policy, canary strategy, monitoring and post-deploy auto actions.

---

## 4) 8-Week Learning Plan (With Exercises)

## Week 1 — Foundations: workflow and quality contracts

**Learn**
- Lifecycle: intent -> design -> codegen -> validate -> repair -> deploy.
- Define quality contracts as machine-checkable gates.

**Exercise**
- Write one-page `Quality Contract` for a mobile feature:
  - Functional requirements.
  - SLO/SLI targets.
  - Security/privacy requirements.
  - Test coverage and flakiness thresholds.

**Deliverable**
- Contract with pass/fail criteria that can be executed in CI.

## Week 2 — Intent normalization and specification DSL

**Learn**
- Convert free-text intent into structured spec (JSON/YAML schema).
- Add ambiguity detection and missing-requirement prompts.

**Exercise**
- Build a simple parser or template-driven transformation:
  - Input: product manager story.
  - Output: structured spec with acceptance tests.

**Deliverable**
- `intent.json` schema + validator that rejects incomplete specs.

## Week 3 — Design synthesis and traceability

**Learn**
- Transform spec into architecture choices, sequence diagrams, API contracts.
- Attach trace IDs from requirements to generated components/tests.

**Exercise**
- Generate a design brief from your `intent.json`.
- Include rationale for tradeoffs and risk list.

**Deliverable**
- Design artifact where each component maps back to requirement IDs.

## Week 4 — Code generation with guardrails

**Learn**
- Template + model-guided code generation with policy checks.
- Enforce style/lint/type constraints before tests.

**Exercise**
- Generate a feature module + tests from a spec.
- Include deterministic prompts/instructions and pinned dependencies.

**Deliverable**
- Reproducible generation script (`make generate`) + lockfile.

## Week 5 — Validation stack (core focus)

**Learn**
- Layered validation:
  - Unit tests.
  - Contract/API tests.
  - Integration tests.
  - UI e2e tests.
  - Static analysis and security scans.
- Flakiness control and confidence scoring.

**Exercise**
- Create a validation pipeline that outputs:
  - Gate-level pass/fail.
  - Defect taxonomy.
  - Confidence score for release.

**Deliverable**
- Machine-readable validation report (`validation-report.json`).

## Week 6 — Automated repair loops (core focus)

**Learn**
- Failure triage and root-cause hints from logs/traces.
- Targeted patch generation and minimal-change strategy.
- Iteration budget + stop conditions.

**Exercise**
- Implement a repair loop:
  1. Detect failed gate.
  2. Classify error (test assertion, null edge case, schema mismatch, flaky timing, etc.).
  3. Generate patch candidates.
  4. Re-run only impacted tests.
  5. Promote best patch if risk score acceptable.

**Deliverable**
- `repair-log.json` with per-iteration diagnosis, patch, and confidence.

## Week 7 — Deployment and safeguards

**Learn**
- Progressive delivery (canary/feature flags).
- Automated rollback and post-deploy validation.

**Exercise**
- Define deploy policy:
  - Canary success criteria.
  - Rollback triggers.
  - Required post-deploy synthetic checks.

**Deliverable**
- `deploy-policy.yaml` + dry-run simulation output.

## Week 8 — Manager-ready demo and narrative

**Learn**
- Tell a value story: speed, quality, reliability, risk reduction.
- Show before/after metrics.

**Exercise**
- Run full demo scenario twice:
  - Baseline without repair loop.
  - Enhanced with auto-repair loop.

**Deliverable**
- Slide deck + recorded walkthrough + metrics table.

---

## 5) Complex Demo Design (Medium Level, Senior Mobile Developer)

## Demo concept

**Project:** “Smart Checkout Reliability Harness” for a mobile commerce app.

### Scenario
A new checkout flow is introduced with generated code from product intent. The flow includes coupon logic, payment retries, and offline fallback. Generated code intentionally includes subtle defects (race condition, rounding bug, API schema mismatch, brittle UI selector).

Your harness must:
1. Ingest intent.
2. Produce design + code artifacts.
3. Execute full validation suite.
4. Diagnose failures automatically.
5. Repair and re-validate.
6. Deploy behind feature flag with canary checks.

## Architecture blueprint

- **Intent Processor**
  - Converts product brief into structured spec.
- **Design Generator**
  - Produces module map, API contract, and risk annotations.
- **Code Generator**
  - Emits feature code + tests scaffold.
- **Validation Engine**
  - Runs static checks, unit, integration, UI e2e, and security checks.
- **Repair Engine**
  - Classifies failures and generates targeted patches.
- **Release Controller**
  - Applies deployment policy and canary/rollback rules.
- **Observability Layer**
  - Correlates each artifact with requirement IDs and run IDs.

## Required tech stack (example)

- Mobile: React Native or Kotlin Multiplatform module (pick one).
- Unit tests: Jest / JUnit.
- UI tests: Detox / Espresso / XCUITest.
- Contracts: JSON Schema + contract test runner.
- Pipeline orchestration: GitHub Actions + lightweight workflow controller (or scripted state machine).
- Repair implementation: scripted patch generator + model call abstraction.

---

## 6) Deep Focus: Auto-Test / Validation / Auto-Repair

## Validation gates (example)

1. **Static gate**
   - Lint/type checks.
   - Secrets and dependency vulnerability scan.
2. **Functional gate**
   - Unit + property tests (coupon rounding boundaries).
3. **Contract gate**
   - Backend response schema compatibility.
4. **Behavior gate**
   - Integration tests for retry/offline flows.
5. **UX gate**
   - Deterministic UI tests and accessibility assertions.
6. **Reliability gate**
   - Flake detector (repeat failing tests N times).

## Repair loop policy

- Max 3 repair iterations per run.
- Only patch files tied to failed traces.
- Reject large diffs or architectural drift.
- Re-run impacted tests first, then full suite.
- Escalate to human when confidence < threshold.

## Failure taxonomy (for diagnosis)

- Assertion mismatch (logic bug).
- Contract mismatch (API shape/version drift).
- Timing/flaky async behavior.
- State-management inconsistency.
- Nullability/edge-case crash.
- Test-only fragility (selector instability).

## Confidence scoring (example)

`confidence = 0.35*test_pass_rate + 0.20*flake_stability + 0.20*diff_locality + 0.15*historical_patch_success + 0.10*security_status`

Promote only if confidence >= 0.85 and all required gates pass.

---

## 7) Example Exercises (Hands-On)

## Exercise A — Intent to acceptance tests

- Input: “As a user, I can apply coupon and pay even with unstable network.”
- Task: convert into structured acceptance criteria + edge-case matrix.
- Success: schema-valid spec and at least 10 generated test cases.

## Exercise B — Introduce synthetic defects

- Inject:
  - Decimal rounding defect.
  - Async race in retry logic.
  - API field rename mismatch.
- Success: validation stack catches all three.

## Exercise C — Auto-repair and retest

- Run repair loop and require:
  - Correct classification of each failure.
  - Minimal patch size.
  - No new regressions.
- Success: all critical tests pass, confidence >= 0.85.

## Exercise D — Deploy simulation

- Deploy behind flag to 5% canary.
- Simulate elevated crash rate.
- Verify auto-rollback + incident artifact generation.

---

## 8) Demo Script for Your Manager (15–20 minutes)

1. **Problem framing (2 min)**
   - “Generated code speed is high; reliability is the bottleneck. This harness solves reliability with automated validation + repair.”
2. **Workflow walk-through (4 min)**
   - Show intent, generated design, and generated code.
3. **Validation failure run (3 min)**
   - Show failing gates and categorized diagnostics.
4. **Auto-repair loop (4 min)**
   - Show patch candidates, selective re-testing, and confidence score.
5. **Deploy decision (3 min)**
   - Show canary gate + rollback policy.
6. **Business impact (2 min)**
   - Lead time reduction, escaped defect reduction, and engineer productivity.

---

## 9) Evidence of Competence (What to Show)

Prepare concrete artifacts:

- `intent.json`, `design.md`, generated module files.
- `validation-report.json` and `repair-log.json`.
- Before/after metrics:
  - Mean time to detect (MTTD).
  - Mean time to repair (MTTR for code defects).
  - Escaped defect rate.
  - Flaky test rate.
  - Deployment success rate.
- A runbook for escalation when auto-repair is uncertain.

---

## 10) Suggested Success Metrics for the Demo

- >= 90% critical path test pass rate after <= 3 repair iterations.
- >= 50% reduction in manual debugging time in controlled scenario.
- <= 5% test flakiness in repeated runs.
- Zero high-severity security findings in release candidate.
- Successful canary + automated rollback under simulated incident.

---

## 11) Practical Tips (From Real Implementations)

- Keep gates deterministic; unstable tests destroy trust.
- Make repair scope small and trace-linked.
- Separate “fixing product code” from “fixing tests.”
- Always store run artifacts; traceability is your credibility.
- Prefer policy-as-code for release decisions.
- Add a human-approval checkpoint for high-risk modules (payments/auth).

---

## 12) Optional Extensions (If You Want to Stand Out)

- Add mutation testing to prove test suite strength.
- Add semantic diff risk scoring (business-critical files weighted higher).
- Add learning memory: which repair tactics historically work per failure class.
- Add post-deploy anomaly feedback loop into future generation prompts.

---

## 13) 30-Second Pitch to Manager

“I built a harness engineering workflow that turns product intent into generated mobile feature code, then automatically validates, diagnoses failures, repairs defects, and enforces deploy gates with canary safety. The key value is reliability at generation speed: fewer escaped defects, faster cycle time, and auditable release decisions.”
