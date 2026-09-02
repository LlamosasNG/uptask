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
