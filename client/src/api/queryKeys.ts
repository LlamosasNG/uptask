export const queryKeys = {
  auth: {
    user: () => ['auth', 'user'] as const,
  },
  projects: {
    all: () => ['projects'] as const,
    detail: (projectId: string) => ['projects', 'detail', projectId] as const,
    edit: (projectId: string) => ['projects', 'edit', projectId] as const,
    team: (projectId: string) => ['projects', 'team', projectId] as const,
  },
  tasks: {
    detail: (projectId: string, taskId: string) =>
      ['projects', projectId, 'tasks', taskId] as const,
  },
}
