import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateStatus } from '@/api/TaskAPI'
import { queryKeys } from '@/api/queryKeys'
import type { Project, Task } from '@/types/index'
import { toast } from 'react-toastify'

export function useTaskStatus(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateStatus,
    onMutate: async ({ taskId, status }) => {
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
      return { previousProject, previousTask }
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
    onSettled: (_data, _error, { taskId }) =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.projects.detail(projectId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.tasks.detail(projectId, taskId),
        }),
      ]),
  })
}
