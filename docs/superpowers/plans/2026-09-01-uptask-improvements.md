# UpTask Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a secure, tested, responsive, accessible, and production-ready UpTask with essential task-planning capabilities.

**Architecture:** Preserve the Express/Mongoose REST API and React/React Query client while introducing explicit policy middleware, centralized contracts, transactional writes, reusable UI primitives, and backward-compatible task fields. Each task is independently testable and builds on the interfaces produced by the previous task.

**Tech Stack:** TypeScript, Express 5, Mongoose, Vitest, Supertest, React 19, React Query, React Router, React Testing Library, Tailwind CSS, Zod.

**Spec:** `docs/superpowers/specs/2026-09-01-uptask-improvements-design.md`

## Global Constraints

- Preserve the existing MERN stack and Spanish user-facing copy.
- Preserve all pre-existing uncommitted user changes and never include them in task commits.
- Keep new task fields backward compatible with existing MongoDB documents.
- Use test-first red-green-refactor for every behavior change.
- Use 401 for unauthenticated, 403 for unauthorized, 404 for missing, 422 for validation, and 500 for unexpected API failures.
- Do not expose secrets, tokens, password hashes, or internal stack traces.

---

### Task 1: API security, errors, and data integrity foundation

**Files:**
- Create: `server/src/errors/HttpError.ts`, `server/src/middleware/error.ts`, `server/src/middleware/notFound.ts`, `server/src/middleware/projectAccess.ts`, `server/src/config/env.ts`
- Create: `server/tests/helpers/database.ts`, `server/tests/projectAuthorization.test.ts`, `server/tests/projectValidation.test.ts`
- Modify: `server/src/server.ts`, `server/src/routes/projectRoutes.ts`, project/task/note controllers and middleware, `server/package.json`

**Interfaces:**
- Produces `requireProjectMember(req,res,next)` and `requireProjectManager(req,res,next)` middleware.
- Produces `asyncHandler(handler)` and a final `errorHandler` returning `{ error: { code, message, fields? } }`.
- Produces validated environment access through `env`.

- [ ] Install Vitest, Supertest, type definitions, and mongodb-memory-server as backend dev dependencies.
- [ ] Write integration tests proving outsiders cannot access project tasks/team/notes, collaborators cannot mutate team/project metadata, managers can, invalid tokens return 401, invalid status/description return 422, and nested notes must belong to the requested task.
- [ ] Run the focused tests and confirm they fail against the existing routes.
- [ ] Implement policy middleware, centralized error handling, complete route validation, correct status codes, and early returns.
- [ ] Replace ignored `Promise.allSettled` results with MongoDB transactions or awaited operations that cannot report false success.
- [ ] Run backend tests and build; refactor only while they remain green.
- [ ] Commit only Task 1 files.

### Task 2: Task planning model and API contracts

**Files:**
- Create: `server/tests/taskPlanning.test.ts`
- Modify: `server/src/models/Task.ts`, task/project/team controllers, `server/src/routes/projectRoutes.ts`, `client/src/types/index.ts`

**Interfaces:**
- Produces optional `assignee`, `dueDate`, and `priority` task fields and timestamped status history.
- Task create/update accepts `{ name, description, assignee?, dueDate?, priority? }` and validates assignee membership.
- Project/task responses populate assignee as `{ _id, name } | null`.

- [ ] Write failing integration tests for default priority, nullable planning fields, invalid priority/date, outsider assignee, valid team assignee, and timestamped status history.
- [ ] Run focused tests and confirm each fails for the intended missing behavior.
- [ ] Extend the model, validators, controllers, and response population with backward-compatible defaults.
- [ ] Update the shared client-side Zod/type definitions to consume the exact API shape.
- [ ] Run Task 2 tests plus the complete backend suite and builds.
- [ ] Commit only Task 2 files.

### Task 3: Client API and application-state resilience

**Files:**
- Create: `client/src/api/errors.ts`, `client/src/api/queryKeys.ts`, `client/src/components/AsyncState.tsx`, corresponding client tests
- Modify: `client/src/lib/axios.ts`, all API modules, authentication/layout/query consumers, `client/package.json`

**Interfaces:**
- Produces `ApiError` with `status`, `code`, `message`, and optional field errors.
- Produces centralized query-key factories and `parseResponse(schema, data)` that throws on schema mismatch.
- A 401 clears the local token and cached user; 403/404/network/schema errors remain distinguishable in UI.

- [ ] Install and configure Vitest, jsdom, and React Testing Library.
- [ ] Write failing tests for normalized API errors, schema mismatch, 401 logout, independent loading states, and retryable network errors.
- [ ] Implement the shared API/error/query utilities and migrate API functions without swallowing non-Axios or malformed-response errors.
- [ ] Replace blank/loading-string branches with consistent loading, error, empty, and retry states.
- [ ] Run client tests, lint, and build; refactor while green.
- [ ] Commit only Task 3 files.

### Task 4: Responsive design system and accessible workflow UI

**Files:**
- Create: focused primitives under `client/src/components/ui/` and workflow tests
- Modify: layouts, dashboard, project/team views, task forms/cards/list/details, and `client/src/index.css`

**Interfaces:**
- Produces reusable `Button`, `Field`, `PageHeader`, `Card`, and `EmptyState` primitives.
- Task form exposes assignee, due date, and priority; project view filters by text, status, assignee, priority, and overdue state.
- Every task status can be changed by an explicit labeled control; drag-and-drop adds keyboard sensors and rolls back failed optimistic updates.

- [ ] Write failing component tests for keyboard-accessible status changes, filter combinations, form validation, focusable controls, and mobile alternative behavior.
- [ ] Implement visual tokens and primitives, then migrate the primary auth, dashboard, project, team, and task surfaces.
- [ ] Add planning fields, filter controls, summary counts, confirmations for destructive actions, and robust optimistic rollback.
- [ ] Run accessibility-oriented component tests, lint, and build.
- [ ] Commit only Task 4 files.

### Task 5: Performance, operations, documentation, and final verification

**Files:**
- Create: `.github/workflows/ci.yml`, `client/.env.example`, `server/.env.example`, operational tests where behavior exists
- Modify: `client/src/router.tsx`, `client/src/main.tsx`, server startup/logging/configuration, `README.md`

**Interfaces:**
- Production routes load lazily and React Query Devtools are development-only.
- API exposes `GET /health` without authentication and validates required environment at startup.
- CI installs with pnpm and runs backend/client tests, lint, and builds.

- [ ] Write failing tests for the health response and environment validation behavior.
- [ ] Implement lazy route modules, development-only devtools, structured safe logging, health/startup behavior, examples, and CI.
- [ ] Run dependency audit, all tests, lint, both production builds, and inspect the bundle report for route splitting.
- [ ] Review the full diff against the design spec and resolve all critical or important findings.
- [ ] Commit only Task 5 files and prepare the branch handoff without pushing or merging.

