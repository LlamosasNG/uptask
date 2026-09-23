import { normalizeApiError } from '@/api/errors'
import LoadingApp from './LoadingApp'
import type { ReactNode } from 'react'
import Button from './ui/Button'

type AsyncStateProps<T> = {
  data: T | undefined
  error: unknown
  isLoading: boolean
  empty: ReactNode
  onRetry?: () => void
  isEmpty?: (data: T) => boolean
  children: (data: T) => ReactNode
}

export default function AsyncState<T>({
  data,
  error,
  isLoading,
  empty,
  onRetry,
  isEmpty = (value) => Array.isArray(value) && value.length === 0,
  children,
}: AsyncStateProps<T>) {
  if (isLoading) return <LoadingApp />

  if (error) {
    const apiError = normalizeApiError(error)
    return (
      <section role="alert" className="py-12 text-center">
        <p className="text-xl font-bold text-slate-700">
          No pudimos cargar este contenido.
        </p>
        <p className="mt-2 text-slate-500">{apiError.message}</p>
        {apiError.isRetryable && onRetry && (
          <Button
            className="mt-5"
            onClick={onRetry}
          >
            Reintentar
          </Button>
        )}
      </section>
    )
  }

  if (data === undefined || isEmpty(data)) {
    return <>{empty}</>
  }

  return <>{children(data)}</>
}
