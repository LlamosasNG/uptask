import type { ReactNode } from 'react'
import Card from './Card'

export default function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <Card className="my-6 text-center">
      <p className="font-semibold text-slate-800">{title}</p>
      {description && (
        <p className="mt-2 text-sm text-slate-600">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </Card>
  )
}
