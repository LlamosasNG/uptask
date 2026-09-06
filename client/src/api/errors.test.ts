import { describe, expect, it } from 'vitest'
import { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { z } from 'zod'
import { ApiError, normalizeApiError, parseResponse } from './errors'

describe('normalizeApiError', () => {
  it('preserves the status, code, message, and field errors from a structured API response', () => {
    const error = normalizeApiError(
      new AxiosError(
        'Request failed with status code 422',
        'ERR_BAD_REQUEST',
        undefined,
        undefined,
        {
        status: 422,
        data: {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Los datos no son válidos.',
            fields: { email: 'El correo ya está en uso.' },
          },
        },
        statusText: 'Unprocessable Entity',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
        }
      )
    )

    expect(error).toMatchObject({
      status: 422,
      code: 'VALIDATION_ERROR',
      message: 'Los datos no son válidos.',
      fields: { email: 'El correo ya está en uso.' },
    })
  })

  it('normalizes legacy string responses without discarding their message', () => {
    const error = normalizeApiError(
      new AxiosError('Request failed with status code 404', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 404,
        data: { error: 'Proyecto no encontrado' },
        statusText: 'Not Found',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      })
    )

    expect(error).toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
      message: 'Proyecto no encontrado',
    })
  })

  it('marks response-less failures as retryable network errors', () => {
    const error = normalizeApiError(new AxiosError('Network Error'))

    expect(error).toMatchObject({
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'No se pudo conectar con el servidor. Intenta de nuevo.',
    })
  })
})

describe('parseResponse', () => {
  it('throws a schema error instead of returning undefined for malformed data', () => {
    expect(() => parseResponse(z.object({ id: z.string() }), { id: 7 })).toThrow(
      expect.objectContaining({
        code: 'SCHEMA_MISMATCH',
        message: 'La respuesta del servidor no tiene el formato esperado.',
      })
    )
  })

  it('returns data that satisfies the supplied schema', () => {
    expect(parseResponse(z.object({ id: z.string() }), { id: 'project-1' })).toEqual({
      id: 'project-1',
    })
  })
})

describe('ApiError', () => {
  it('identifies retryable network failures', () => {
    expect(new ApiError({ status: 0, code: 'NETWORK_ERROR', message: 'Sin conexión' }).isRetryable).toBe(true)
  })

  it.each([
    new ApiError({ status: 0, code: 'SCHEMA_MISMATCH', message: 'Formato inválido' }),
    new ApiError({ status: 0, code: 'UNKNOWN_ERROR', message: 'Error inesperado' }),
  ])('does not offer retry for non-network status-zero errors', (error) => {
    expect(error.isRetryable).toBe(false)
  })
})
