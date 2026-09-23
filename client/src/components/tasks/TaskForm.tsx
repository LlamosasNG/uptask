import {
  useController,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from 'react-hook-form'
import {
  taskFormSchema,
  taskPrioritySchema,
  type TaskFormData,
} from '@/types/index'
import { useAuth } from '@/hooks/useAuth'
import { getProjectTeam } from '@/api/TeamAPI'
import { queryKeys } from '@/api/queryKeys'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import Field from '../ui/Field'
import Button from '../ui/Button'

export default function TaskForm({
  errors,
  register,
  control,
}: {
  errors: FieldErrors<TaskFormData>
  register: UseFormRegister<TaskFormData>
  control: Control<TaskFormData>
}) {
  const { field: assigneeField } = useController({ name: 'assignee', control })
  const projectId = useParams().projectId!
  const { data: manager } = useAuth()
  const {
    data: team,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: queryKeys.projects.team(projectId),
    queryFn: () => getProjectTeam(projectId),
    retry: false,
  })
  const members = Array.from(
    new Map(
      [...(manager ? [manager] : []), ...(team ?? [])].map((member) => [
        member._id,
        member,
      ]),
    ).values(),
  )
  return (
    <div className="space-y-5">
      <Field label="Nombre de la tarea" id="name" error={errors.name?.message}>
        <input
          type="text"
          className="field-control"
          placeholder="Nombre de la tarea"
          {...register('name', {
            setValueAs: (value) => value.trim(),
            validate: (value) =>
              !!value.trim() || 'El nombre de la tarea es obligatorio',
          })}
        />
      </Field>
      <Field
        label="Descripción de la tarea"
        id="description"
        error={errors.description?.message}
      >
        <textarea
          rows={3}
          className="field-control"
          placeholder="Descripción de la tarea"
          {...register('description', {
            setValueAs: (value) => value.trim(),
            validate: (value) =>
              !!value.trim() || 'La descripción de la tarea es obligatoria',
          })}
        />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Responsable"
          id="assignee"
          error={errors.assignee?.message}
        >
          <select
            className="field-control"
            {...assigneeField}
            value={assigneeField.value ?? ''}
            onChange={(event) =>
              assigneeField.onChange(event.target.value || null)
            }
          >
            <option value="">Sin asignar</option>
            {members.map((member) => (
              <option key={member._id} value={member._id}>
                {member.name}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Fecha límite"
          id="dueDate"
          error={errors.dueDate?.message}
        >
          <input
            type="date"
            className="field-control"
            {...register('dueDate', {
              setValueAs: (value) => value || null,
              validate: (value) =>
                taskFormSchema.shape.dueDate.safeParse(value).success ||
                'Introduce una fecha válida',
            })}
          />
        </Field>
        <Field label="Prioridad" id="priority" error={errors.priority?.message}>
          <select
            className="field-control"
            {...register('priority', {
              validate: (value) =>
                taskPrioritySchema.safeParse(value).success ||
                'Selecciona una prioridad válida',
            })}
          >
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
          </select>
        </Field>
      </div>
      {isLoading && (
        <p role="status" className="text-sm text-slate-600">
          Cargando responsables…
        </p>
      )}
      {error && (
        <div role="alert" className="text-sm text-red-700">
          No se pudo cargar el equipo.{' '}
          <Button variant="secondary" onClick={() => void refetch()}>
            Reintentar
          </Button>
        </div>
      )}
    </div>
  )
}
