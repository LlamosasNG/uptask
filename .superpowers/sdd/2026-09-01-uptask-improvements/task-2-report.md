# Task 2 report: Task planning model and API contracts

## Delivered

- Added optional `assignee` and `dueDate` fields to tasks, both defaulting to `null`, plus `low | medium | high` priority with a `medium` default.
- Added `createdAt` to new task-status history entries.
- Validated create and update task planning input: ISO dates, supported priorities, Mongo IDs, and project-manager/team-member assignees.
- Populated task assignees as `{ _id, name } | null` in project, task-detail, and project-task responses.
- Cleared an assignee atomically when that team member is removed, preserving the membership invariant.
- Updated client Zod/types for the exact planning API fields while keeping all new fields optional for legacy tasks that do not yet store them.

## RED evidence

1. Added `server/tests/taskPlanning.test.ts` before production changes, covering default planning values, malformed priority/date, outsider assignment, valid team assignment/population, planning-field updates, and timestamped history.
2. Ran `pnpm test -- taskPlanning.test.ts` in `server/` against the original implementation.
   - Result: 7 task-planning tests failed for their intended missing behavior.
   - The failures showed missing default/null fields, 200 responses for invalid planning input and outsider assignees, missing populated assignee data, ignored update fields, and absent status-history `createdAt`.
3. Added a final member-removal invariant test before its implementation.
   - Result: 1 expected failure: the removed member remained populated as the task assignee.

## GREEN evidence

- `cd server && pnpm test -- taskPlanning.test.ts`
  - Passed: 3 test files, 19 tests (including all 8 Task 2 integration tests).
- `cd server && pnpm test`
  - Passed: 3 test files, 19 tests.
- `cd server && pnpm build`
  - Passed: TypeScript compilation.
- `cd client && pnpm build`
  - Passed: TypeScript compilation and Vite production build.

## Review notes

- `git diff --check` reported no whitespace errors.
- The client schemas deliberately use optional planning fields and optional history timestamps so documents created before this migration continue to parse. Newly created API records always emit the model defaults and timestamped history entries.
- No pre-existing user changes were included in this task's staged scope.

## Fix round 1: request type and branch coverage

### Root cause

`TaskFormData` was a `Pick<Task, ...>`, which copied `assignee` from the response schema. Response assignees are populated objects (`{ _id, name } | null`), but create/update requests require an ID string or `null`. The client request type therefore described the wrong API boundary.

### Change

- Replaced the response-derived form type with `taskFormSchema` and `TaskFormData` inferred from it. The request schema accepts `assignee?: string | null`, ISO date/date-time `dueDate?: string | null`, and optional priority.
- Added integration coverage for manager assignment and its populated `GET /:projectId/tasks` response.
- Added update-route validation coverage for invalid priority, invalid due date, and outsider assignee values, including persisted-state checks.

### RED evidence

The original implementation already contained the shared validation/population logic, so the new tests were mutation-checked to prove they guard the intended branches:

1. Temporarily disabled manager membership, removed the update-route planning validators, and ran `cd server && pnpm test -- taskPlanning.test.ts`.
   - Result: 4 failures among 23 tests.
   - Manager assignment returned `422` instead of `200`.
   - Invalid priority and due-date updates returned `500` instead of standardized `422` errors.
   - Outsider assignment update returned `200` instead of `422`.
2. Restored those branches, temporarily removed assignee population from `TaskController.getProjectTasks`, and ran the same command.
   - Result: 1 failure among 23 tests.
   - `GET /:projectId/tasks` returned a raw assignee ID where the test required `{ _id, name }`.

All temporary mutations were restored before final verification.

### GREEN evidence

Fresh final commands and output:

- `cd server && pnpm test -- taskPlanning.test.ts`
  - Exit `0`; 3 test files passed, 23 tests passed.
- `cd server && pnpm test`
  - Exit `0`; 3 test files passed, 23 tests passed.
- `cd server && pnpm build`
  - Exit `0`; TypeScript compilation passed.
- `cd client && pnpm build`
  - Exit `0`; TypeScript compilation and Vite production build passed.
