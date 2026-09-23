import type { ReactNode } from 'react'

export default function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl break-words">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-3xl text-slate-600 break-words">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <nav
          aria-label="Acciones de la página"
          className="flex flex-wrap gap-3 shrink-0"
        >
          {actions}
        </nav>
      )}
    </header>
  )
}
