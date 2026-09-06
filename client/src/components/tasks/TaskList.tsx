import { statusTranslations } from '@/locales/es'
import {
  taskStatusSchema,
  type TaskProject,
  type TaskStatus,
} from '@/types/index'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTaskStatus } from '@/hooks/useTaskStatus'
import TaskCard from './TaskCard'
import DropTask from './DropTask'
import Card from '../ui/Card'
import Field from '../ui/Field'
import Button from '../ui/Button'
import EmptyState from '../ui/EmptyState'

export default function TaskList({
  tasks,
  canEdit,
}: {
  tasks: TaskProject[]
  canEdit: boolean
}) {
  const projectId = useParams().projectId!
  const { mutate, isPending, error } = useTaskStatus(projectId)
  const boardRef = useRef<HTMLDivElement>(null)
  const returnFocusTo = useRef<string | null>(null)
  useEffect(() => {
    if (isPending || !returnFocusTo.current) return
    const taskId = returnFocusTo.current
    returnFocusTo.current = null
    // Moving between columns remounts the card. Restore keyboard focus after the request settles.
    if (document.activeElement === document.body) {
      const control = Array.from(
        boardRef.current?.querySelectorAll<HTMLSelectElement>(
          'select[data-task-id]',
        ) ?? [],
      ).find((select) => select.dataset.taskId === taskId)
      ;(control ?? boardRef.current)?.focus()
    }
  }, [tasks, isPending])
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  )
  const [text, setText] = useState('')
  const [status, setStatus] = useState('all')
  const [assignee, setAssignee] = useState('all')
  const [priority, setPriority] = useState('all')
  const [overdueOnly, setOverdueOnly] = useState(false)
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const isOverdue = (task: TaskProject) =>
    !!task.dueDate &&
    task.dueDate.slice(0, 10) < today &&
    task.status !== 'completed'
  const assignees = new Map(
    tasks.flatMap((task) =>
      task.assignee ? [[task.assignee._id, task.assignee.name] as const] : [],
    ),
  )
  const filtered = tasks.filter(
    (task) =>
      `${task.name} ${task.description}`
        .toLocaleLowerCase()
        .includes(text.trim().toLocaleLowerCase()) &&
      (status === 'all' || task.status === status) &&
      (priority === 'all' || (task.priority ?? 'medium') === priority) &&
      (assignee === 'all' ||
        (assignee === 'unassigned'
          ? !task.assignee
          : task.assignee?._id === assignee)) &&
      (!overdueOnly || isOverdue(task)),
  )
  const changeStatus = (taskId: string, nextStatus: TaskStatus) => {
    if (
      !isPending &&
      tasks.find((task) => task._id === taskId)?.status !== nextStatus
    )
      mutate({ projectId, taskId, status: nextStatus })
  }
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const parsed = taskStatusSchema.safeParse(over?.id)
    if (parsed.success) changeStatus(String(active.id), parsed.data)
  }
  const reset = () => {
    setText('')
    setStatus('all')
    setAssignee('all')
    setPriority('all')
    setOverdueOnly(false)
  }

  return (
    <section aria-label="Tareas del proyecto" className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Total de tareas', 'Total', tasks.length],
          [
            'Pendientes o en progreso',
            'Pendientes / en progreso',
            tasks.filter((task) => task.status !== 'completed').length,
          ],
          [
            'Tareas completadas',
            'Completadas',
            tasks.filter((task) => task.status === 'completed').length,
          ],
          ['Tareas vencidas', 'Vencidas', tasks.filter(isOverdue).length],
        ].map(([label, title, count]) => (
          <Card key={label} role="group" aria-label={String(label)}>
            <p className="text-sm text-slate-600">{title}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{count}</p>
          </Card>
        ))}
      </div>
      <Card>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Buscar tareas" id="task-search">
            <input
              type="search"
              className="field-control"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Nombre o descripción"
            />
          </Field>
          <Field label="Filtrar por estado" id="task-status-filter">
            <select
              className="field-control"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="all">Todos los estados</option>
              {Object.entries(statusTranslations).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Filtrar por responsable" id="task-assignee-filter">
            <select
              className="field-control"
              value={assignee}
              onChange={(event) => setAssignee(event.target.value)}
            >
              <option value="all">Todos los responsables</option>
              <option value="unassigned">Sin asignar</option>
              {Array.from(assignees, ([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Filtrar por prioridad" id="task-priority-filter">
            <select
              className="field-control"
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
            >
              <option value="all">Todas las prioridades</option>
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
            </select>
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={(event) => setOverdueOnly(event.target.checked)}
              className="rounded border-slate-300 text-violet-700"
            />
            Solo vencidas
          </label>
          <Button variant="secondary" onClick={reset}>
            Limpiar filtros
          </Button>
        </div>
      </Card>
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Tareas</h2>
        <p className="mt-2 text-sm text-slate-600">
          Cambia el estado desde cada tarjeta o arrastra con el control Mover.
          Desplázate horizontalmente para ver todos los estados.
        </p>
      </div>
      <p aria-live="polite" className="text-sm text-slate-600">
        {filtered.length} de {tasks.length} tareas
      </p>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          No se pudo cambiar el estado: {error.message}
        </p>
      )}
      {!filtered.length && (
        <EmptyState
          title={
            tasks.length
              ? 'No hay tareas con estos filtros'
              : 'No hay tareas todavía'
          }
          description={
            tasks.length
              ? 'Prueba otros filtros o limpia la búsqueda.'
              : 'Agrega una tarea para empezar a organizar el proyecto.'
          }
        />
      )}
      <DndContext
        sensors={sensors}
        onDragEnd={handleDragEnd}
        accessibility={{
          screenReaderInstructions: {
            draggable:
              'Para mover una tarea, pulsa espacio. Usa las flechas para moverla, espacio para soltar o Escape para cancelar. También puedes usar el selector de estado.',
          },
        }}
      >
        <div
          ref={boardRef}
          role="region"
          aria-label="Tablero por estado"
          tabIndex={0}
          className="flex gap-4 overflow-x-auto pb-6 snap-x snap-proximity"
        >
          {taskStatusSchema.options.map((column) => {
            const columnTasks = filtered.filter(
              (task) => task.status === column,
            )
            return (
              <section
                key={column}
                aria-label={statusTranslations[column]}
                className="w-72 min-w-72 lg:min-w-64 flex-1 snap-start rounded-2xl border border-slate-200 bg-slate-100 p-3"
              >
                <h3 className="flex justify-between gap-2 p-2 font-semibold text-slate-800">
                  {statusTranslations[column]}
                  <span className="rounded-full bg-white px-2 text-sm">
                    {columnTasks.length}
                  </span>
                </h3>
                <DropTask status={column} />
                <ul className="mt-3 space-y-3">
                  {columnTasks.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      canEdit={canEdit}
                      statusPending={isPending}
                      onStatusChange={(next) => {
                        if (document.activeElement instanceof HTMLSelectElement)
                          returnFocusTo.current = task._id
                        changeStatus(task._id, next)
                      }}
                    />
                  ))}
                </ul>
                {!columnTasks.length && (
                  <p className="p-4 text-center text-sm text-slate-500">
                    No hay tareas
                  </p>
                )}
              </section>
            )
          })}
        </div>
      </DndContext>
    </section>
  )
}
