import { isAxiosError } from 'axios'
import { z } from 'zod'

export type ApiErrorFields = Record<string, string | string[]>

type ApiErrorOptions = {
  status: number
  code: string
  message: string
  fields?: ApiErrorFields
  cause?: unknown
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly fields?: ApiErrorFields

  constructor({ status, code, message, fields, cause }: ApiErrorOptions) {
    super(message, cause === undefined ? undefined : { cause })
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fields = fields
  }

  get isRetryable() {
    return this.code === 'NETWORK_ERROR' || this.status >= 500
  }
}

const statusCode = (status: number) =>
  ({
    401: 'UNAUTHENTICATED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    422: 'VALIDATION_ERROR',
  })[status] ?? 'API_ERROR'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (isAxiosError(error)) {
    if (!error.response) {
      return new ApiError({
        status: 0,
        code: 'NETWORK_ERROR',
        message: 'No se pudo conectar con el servidor. Intenta de nuevo.',
        cause: error,
      })
    }

    const { status, data } = error.response
    const payload = isRecord(data) ? data.error : undefined

    if (isRecord(payload) && typeof payload.message === 'string') {
      return new ApiError({
        status,
        code: typeof payload.code === 'string' ? payload.code : statusCode(status),
        message: payload.message,
        fields: isRecord(payload.fields)
          ? (payload.fields as ApiErrorFields)
          : undefined,
        cause: error,
      })
    }

    if (typeof payload === 'string') {
      return new ApiError({
        status,
        code: statusCode(status),
        message: payload,
        cause: error,
      })
    }

    return new ApiError({
      status,
      code: statusCode(status),
      message: 'El servidor devolvió un error inesperado.',
      cause: error,
    })
  }

  return new ApiError({
    status: 0,
    code: 'UNKNOWN_ERROR',
    message:
      error instanceof Error && error.message
        ? error.message
        : 'Ocurrió un error inesperado.',
    cause: error,
  })
}

export function parseResponse<T>(schema: z.ZodType<T>, data: unknown): T {
  const parsed = schema.safeParse(data)
  if (!parsed.success) {
    throw new ApiError({
      status: 0,
      code: 'SCHEMA_MISMATCH',
      message: 'La respuesta del servidor no tiene el formato esperado.',
      cause: parsed.error,
    })
  }

  return parsed.data
}
