import { cloneElement, type ReactElement } from 'react'

type FieldProps = {
  label: string
  id: string
  error?: string
  children: ReactElement<{
    id?: string
    'aria-invalid'?: boolean
    'aria-describedby'?: string
  }>
}

export default function Field({ label, id, error, children }: FieldProps) {
  return (
    <div className="space-y-2 min-w-0">
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-slate-700"
      >
        {label}
      </label>
      {cloneElement(children, {
        id,
        'aria-invalid': !!error,
        'aria-describedby': error ? `${id}-error` : undefined,
      })}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}
