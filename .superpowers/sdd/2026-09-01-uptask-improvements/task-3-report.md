# Task 3 — Client API and application-state resilience

## Delivered

- Added Vitest, jsdom, and React Testing Library with a shared setup file and `pnpm test` script.
- Added `ApiError`, structured/legacy Axios error normalization, schema parsing that throws, and retryability classification.
- Added centralized React Query key factories and migrated query and invalidation consumers.
- Added an auth-session event utility. The Axios response interceptor normalizes errors; a 401 removes `AUTH_TOKEN` and clears the cached user through the bound QueryClient without importing application state from the HTTP client.
- Removed API-module catch blocks that previously swallowed non-Axios errors and schema mismatches.
- Added a reusable Spanish `AsyncState` for loading, error, empty, and retry UI. Query views now maintain independent loading states, retain 404 routing where appropriate, and render other errors (including 403, network, and schema failures) distinctly with their server/actionable message.

## TDD evidence

### RED

1. `pnpm test src/api/errors.test.ts src/lib/authSession.test.ts src/components/AsyncState.test.tsx`
   - Failed because `./errors`, `@/api/queryKeys`, `./authSession`, and `./AsyncState` did not exist.
2. `pnpm test src/api/ProjectAPI.test.ts`
   - Failed as intended: malformed project data resolved as `undefined` instead of rejecting. This demonstrated the prior `safeParse` path swallowed schema failures.

### GREEN

1. `pnpm test src/api/errors.test.ts src/lib/authSession.test.ts src/components/AsyncState.test.tsx`
   - Passed: 10 tests.
2. `pnpm test src/api/ProjectAPI.test.ts src/api/errors.test.ts src/lib/authSession.test.ts src/components/AsyncState.test.tsx`
   - Passed: 11 tests.
3. Final verification:
   - `pnpm test` — 4 test files, 11 tests passed.
   - `pnpm lint` — passed.
   - `pnpm build` — passed.
   - `git diff --check` — passed.

## Coverage

- Structured API errors preserve HTTP status, machine code, Spanish message, and field errors.
- Legacy `{ error: string }` API errors retain their message and derive a meaningful code.
- Network failures become retryable `NETWORK_ERROR` values.
- Invalid schema responses reject as `SCHEMA_MISMATCH` rather than becoming `undefined`.
- A real Axios 401 interceptor flow removes the local token and cached user.
- `AsyncState` exercises independent loading, retryable network error, and empty-data behavior.

## Note

The production build emits Vite's existing large-chunk warning (the entry JavaScript is about 770 kB minified). Route splitting and production developer-tool removal are separate scope items in the broader design, not part of this task's visual/build optimization work.

## Fix round 1

### Root cause and correction

- `removeQueries` removed the active auth query while observers were still attached. The session transition now writes `null` to the user query and cancels its fetch, leaving both manual logout and a 401 observer in the settled signed-out (`success`, `data: null`) state.
- Task query consumers had no loading/error UI and redirected every error. They now use `AsyncState`, offer retry for retryable failures, and redirect only normalized 404 errors.
- Project edit/team routes now redirect normalized 404 errors to `/404` and retain 403/network/schema errors inline.
- `findMemberById` parses `teamMemberSchema`; retryability is limited to `NETWORK_ERROR` and 5xx responses.

### TDD evidence

#### RED

`pnpm test src/components/tasks/TaskQueryStates.test.tsx src/views/projects/ProjectRouteErrorStates.test.tsx src/lib/authSession.test.ts`

Exact result before the route-consumer production edits:

```
Test Files  2 failed | 1 passed (3)
Tests  9 failed | 5 passed (14)
```

The failures showed missing task loading/retry UI, 403 redirects instead of inline errors, and absent 404 routing for project edit/team views. The active 401 observer test passed once its adapter was correctly installed before subscription and asserted the intended canceled-query settled state.

#### GREEN

`pnpm test src/components/tasks/TaskQueryStates.test.tsx src/views/projects/ProjectRouteErrorStates.test.tsx src/lib/authSession.test.ts src/api/errors.test.ts src/api/TeamAPI.test.ts src/views/DashboardView.test.tsx`

Exact result:

```
Test Files  6 passed (6)
Tests  24 passed (24)
```

### Final verification

`pnpm test && pnpm lint && pnpm build && git diff --check`

Exact result:

```
Test Files  8 passed (8)
Tests  28 passed (28)
✓ built in 394ms
```

`pnpm lint` and `git diff --check` exited with status 0 and emitted no errors. Vite retained its existing warning that the 771.00 kB minified entry chunk exceeds 500 kB.

### Fix files

- `client/src/lib/authSession.ts`
- `client/src/lib/authSession.test.ts`
- `client/src/lib/axios.ts`
- `client/src/api/errors.ts`
- `client/src/api/errors.test.ts`
- `client/src/api/TeamAPI.ts`
- `client/src/api/TeamAPI.test.ts`
- `client/src/components/NavMenu.tsx`
- `client/src/layouts/AppLayout.tsx`
- `client/src/views/DashboardView.test.tsx`
- `client/src/components/tasks/EditTaskData.tsx`
- `client/src/components/tasks/TaskModalDetails.tsx`
- `client/src/components/tasks/TaskQueryStates.test.tsx`
- `client/src/views/projects/EditProjectView.tsx`
- `client/src/views/projects/ProjectTeamView.tsx`
- `client/src/views/projects/ProjectRouteErrorStates.test.tsx`
