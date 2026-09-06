import {
  useMutation,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import { updateStatus } from '@/api/TaskAPI'
import { queryKeys } from '@/api/queryKeys'
import type { Project, Task } from '@/types/index'
import { toast } from 'react-toastify'

// All hook instances sharing a project cache must also share its write order.
// React Query mutation scopes alone do not serialize onMutate snapshots.
const statusWrites = new WeakMap<QueryClient, Map<string, Promise<void>>>()

async function acquireStatusWrite(queryClient: QueryClient, projectId: string) {
  let projects = statusWrites.get(queryClient)
  if (!projects) {
    projects = new Map()
    statusWrites.set(queryClient, projects)
  }
  const previous = projects.get(projectId)
  let resolve!: () => void
  const current = new Promise<void>((done) => {
    resolve = done
  })
  projects.set(projectId, current)
  await previous
  return () => {
    if (projects.get(projectId) === current) projects.delete(projectId)
    resolve()
  }
}

export function useTaskStatus(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateStatus,
    onMutate: async ({ taskId, status }) => {
      const release = await acquireStatusWrite(queryClient, projectId)
      try {
        const projectKey = queryKeys.projects.detail(projectId)
        const taskKey = queryKeys.tasks.detail(projectId, taskId)
        await Promise.all([
          queryClient.cancelQueries({ queryKey: projectKey }),
          queryClient.cancelQueries({ queryKey: taskKey }),
        ])
        const previousProject = queryClient.getQueryData<Project>(projectKey)
        const previousTask = queryClient.getQueryData<Task>(taskKey)
        queryClient.setQueryData<Project>(
          projectKey,
          (previous) =>
            previous && {
              ...previous,
              tasks: previous.tasks.map((task) =>
                task._id === taskId ? { ...task, status } : task,
              ),
            },
        )
        queryClient.setQueryData<Task>(
          taskKey,
          (previous) => previous && { ...previous, status },
        )
        return { previousProject, previousTask, release }
      } catch (error) {
        release()
        throw error
      }
    },
    onError: (error, { taskId }, context) => {
      if (context?.previousProject)
        queryClient.setQueryData(
          queryKeys.projects.detail(projectId),
          context.previousProject,
        )
      if (context?.previousTask)
        queryClient.setQueryData(
          queryKeys.tasks.detail(projectId, taskId),
          context.previousTask,
        )
      toast.error(error.message)
    },
    onSuccess: (data) => {
      toast.success(data)
    },
    onSettled: (_data, _error, { taskId }, context) => {
      try {
        return Promise.all([
          queryClient.invalidateQueries({
            queryKey: queryKeys.projects.detail(projectId),
          }),
          queryClient.invalidateQueries({
            queryKey: queryKeys.tasks.detail(projectId, taskId),
          }),
        ])
      } finally {
        context?.release()
      }
    },
  })
}
