# UpTask Improvements Design

## Goal

Harden UpTask's authorization and data integrity, establish automated regression coverage, improve its responsive and accessible user experience, add the minimum task-planning fields users need, and reduce production bundle and operational risk without replacing the MERN stack.

## Architecture

The Express API remains REST-based and gains explicit project-member and project-manager policies, centralized request/error handling, validated response contracts, and transactional multi-document writes. Task planning is extended with optional assignee, due date, and priority fields so existing MongoDB documents remain valid.

The React application keeps React Query as its server-state boundary. Shared UI primitives and route-level loading/error states provide consistent behavior, while the project board supports pointer, touch, and keyboard workflows. Routes are lazy-loaded and development-only tooling is excluded from production.

## Required behavior

- Every project-scoped endpoint verifies project membership before returning data.
- Only the project manager can modify project metadata or team membership; members can update task status and add notes.
- A note must belong to the task in the URL before it can be read or deleted; only its author can delete it.
- Authentication failures return 401, authorization failures 403, missing resources 404, validation failures 422, and unexpected failures 500.
- Compound persistence never reports success when one write failed.
- Client-side schema mismatches and network failures surface as actionable UI errors.
- Existing projects and tasks remain readable when new planning fields are absent.
- The primary project and task flows work responsively and without requiring drag-and-drop.
- Production builds omit developer tooling and split application routes.

## Task planning model

- `priority`: optional enum `low | medium | high`, default `medium` for newly created tasks.
- `dueDate`: optional ISO date or `null`.
- `assignee`: optional project-member user ID or `null`.
- Status history entries include `createdAt` in addition to user and status.
- Project task responses expose the assignee's `_id` and `name` when present.

## UI direction

Use a restrained slate and violet visual system with reusable controls, visible focus states, responsive page widths, clear hierarchy, skeleton/loading states, and explicit empty/error states. Desktop retains a Kanban board; small screens use a readable stacked workflow and every task exposes a status selector as the non-drag alternative.

## Verification

Backend integration tests cover authentication, manager/member/outsider authorization, nested-resource ownership, validation, and compound writes. Frontend tests cover API failures, route states, filters, and accessible task status changes. CI runs lint, tests, and production builds.
