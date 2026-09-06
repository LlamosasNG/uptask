import { statusTranslations } from '@/locales/es'
import type { TaskStatus } from '@/types/index'
import Field from '../ui/Field'
import { useId } from 'react'

export default function TaskStatusControl({
  taskId,
  name,
  status,
  disabled,
  onChange,
}: {
  taskId: string
  name: string
  status: TaskStatus
  disabled?: boolean
  onChange: (status: TaskStatus) => void
}) {
  const id = useId()
  return (
    <Field id={`status-${taskId}-${id}`} label={`Estado de ${name}`}>
      <select
        data-task-id={taskId}
        className="field-control"
        value={status}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as TaskStatus)}
      >
        {Object.entries(statusTranslations).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </Field>
  )
}
