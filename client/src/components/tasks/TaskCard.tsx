import { deleteTask } from '@/api/TaskAPI'
import type { TaskProject, TaskStatus } from '@/types/index'
import { useDraggable } from '@dnd-kit/core'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { queryKeys } from '@/api/queryKeys'
import Card from '../ui/Card'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import TaskStatusControl from './TaskStatusControl'

export default function TaskCard({
  task,
  canEdit,
  onStatusChange,
  statusPending,
}: {
  task: TaskProject
  canEdit: boolean
  onStatusChange: (status: TaskStatus) => void
  statusPending?: boolean
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const projectId = useParams().projectId!
  const [confirmDelete, setConfirmDelete] = useState(false)
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id: task._id, disabled: statusPending })
  const queryClient = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: deleteTask,
    onError: (error) => {
      toast.error(error.message)
    },
    onSuccess: (data) => {
      setConfirmDelete(false)
      toast.success(data)
      void queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(projectId),
      })
    },
  })
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 20 : undefined,
      }
    : undefined
  return (
    <li ref={setNodeRef} style={style} className="relative">
      <Card className="space-y-4 !p-4">
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            aria-label={`Ver tarea ${task.name}`}
            onClick={() =>
              navigate(`${location.pathname}?viewTask=${task._id}`)
            }
            className="min-w-0 break-words text-left font-semibold text-slate-900 hover:text-violet-700"
          >
            {task.name}
          </button>
          <button
            ref={setActivatorNodeRef}
            {...listeners}
            {...attributes}
            type="button"
            aria-label={`Mover tarea ${task.name}`}
            disabled={statusPending}
            className="shrink-0 touch-none rounded-lg p-2 text-slate-500 hover:bg-slate-100 cursor-grab active:cursor-grabbing"
          >
            ↔
          </button>
        </div>
        <p className="break-words text-sm text-slate-600">{task.description}</p>
        <div className="space-y-1 text-xs text-slate-600">
          <p>
            <span className="font-semibold">Responsable:</span>{' '}
            {task.assignee?.name ?? 'Sin asignar'}
          </p>
          <p>
            <span className="font-semibold">Prioridad:</span>{' '}
            {
              { low: 'Baja', medium: 'Media', high: 'Alta' }[
                task.priority ?? 'medium'
              ]
            }
          </p>
          {task.dueDate && (
            <p>
              <span className="font-semibold">Fecha límite:</span>{' '}
              <time dateTime={task.dueDate.slice(0, 10)}>
                {task.dueDate.slice(0, 10)}
              </time>
            </p>
          )}
        </div>
        <TaskStatusControl
          taskId={task._id}
          name={task.name}
          status={task.status}
          disabled={statusPending}
          onChange={onStatusChange}
        />
        {canEdit && (
          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
            <Button
              variant="secondary"
              className="!px-3 !text-xs"
              aria-label={`Editar tarea ${task.name}`}
              onClick={() =>
                navigate(`${location.pathname}?editTask=${task._id}`)
              }
            >
              Editar
            </Button>
            <Button
              variant="danger"
              className="!px-3 !text-xs"
              aria-label={`Eliminar tarea ${task.name}`}
              onClick={() => setConfirmDelete(true)}
            >
              Eliminar
            </Button>
          </div>
        )}
      </Card>
      <ConfirmDialog
        open={confirmDelete}
        title="Eliminar tarea"
        description={`Se eliminará “${task.name}” y sus notas. Esta acción no se puede deshacer.`}
        pending={isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => mutate({ projectId, taskId: task._id })}
      />
    </li>
  )
}
