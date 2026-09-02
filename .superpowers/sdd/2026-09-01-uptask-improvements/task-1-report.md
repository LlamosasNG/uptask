# Task 1 report: API security, errors, and data integrity foundation

## Status

Implemented the Task 1 API security and integrity foundation on `feat/uptask-improvements`.

## Implementation

- Added `HttpError`, `asyncHandler`, final structured `errorHandler`, and a 404 fallback. Error responses use `{ error: { code, message, fields? } }`.
- Added validated `env` access for `DATABASE_URL` and `JWT_SECRET`; app construction is now separate from database startup so it can be used safely by integration tests.
- Added explicit `requireProjectMember` and `requireProjectManager` policies and applied them to all project-scoped reads/mutations. Managers retain project/team management; project members may read project resources, update status, and manage notes.
- Corrected project description validation, constrained task statuses to the persisted enum, and return 422 structured field errors for validation failures.
- Replaced ignored `Promise.allSettled` compound writes in project/task/note operations with MongoDB transactions. Project/task cascading deletion is also executed in the transaction.
- Enforced that task IDs belong to the request project and that a deleted note belongs to the task in its URL.
- Added Vitest/Supertest/mongodb-memory-server integration coverage and a backend test script.

## RED evidence

Command: `pnpm test -- projectAuthorization.test.ts projectValidation.test.ts`

- Before the implementation, `projectValidation.test.ts` failed as expected: invalid task status and empty description both returned `500`, where the contract requires `422`.
- The first authorization attempt also timed out while mongodb-memory-server downloaded its initial MongoDB binary (default Vitest hook timeout); this was test infrastructure startup, not an application assertion. After the binary cache warmed, the existing app still lacked the required centralized/policy behavior.

## GREEN evidence

Command: `pnpm test -- projectAuthorization.test.ts projectValidation.test.ts`

- Passed: 2 files, 10 integration tests. Covers invalid-token 401, outsider access to tasks/team/notes, member restrictions, manager success, cross-task note deletion, invalid status, and invalid description.

Final verification:

- `pnpm build` — passed.
- `pnpm test` — passed: 2 files, 10 tests.
- `git diff --check` — passed.

## Files changed

- New: `server/src/errors/HttpError.ts`, `server/src/config/env.ts`, `server/src/middleware/error.ts`, `server/src/middleware/notFound.ts`, `server/src/middleware/projectAccess.ts`.
- New tests: `server/tests/helpers/database.ts`, `server/tests/projectAuthorization.test.ts`, `server/tests/projectValidation.test.ts`.
- Updated server composition, route policy/validation, auth/project/task middleware, project/task/note/team controllers, DB/JWT env consumers, and `server/package.json`.

## Self-review

- Confirmed failures are centralized for the touched project-scoped API paths; errors do not continue into handlers after middleware rejects them.
- Confirmed project reads, tasks, team, and notes all enforce project membership; metadata/team endpoints require the manager.
- Confirmed cross-task note deletion returns 404 without removing the note.
- Confirmed every replaced multi-document project/task/note persistence operation waits for a transaction commit before sending success.
- Intentionally did not alter the pre-existing user change in `server/src/controllers/AuthController.ts`.

## Concerns

- `server/pnpm-lock.yaml` already contained a large user-owned dependency-refresh diff before this task. Adding test dependencies necessarily extended it, but its hunks cannot be safely separated from the pre-existing lockfile changes. It is left unstaged for the owner to reconcile.
- Existing `AuthController` contains unrelated pre-existing `Promise.allSettled` uses. It was outside the task's listed controller scope and includes an existing user modification, so it remains untouched.
