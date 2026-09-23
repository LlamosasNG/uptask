import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/axios', () => ({ default: vi.fn() }))

import api from '@/lib/axios'
import { getProjects } from './ProjectAPI'

describe('getProjects', () => {
  it('rejects malformed project data instead of treating it as an empty response', async () => {
    vi.mocked(api).mockResolvedValueOnce({ data: [{ projectName: 'Sin identificador' }] })

    await expect(getProjects()).rejects.toMatchObject({ code: 'SCHEMA_MISMATCH' })
  })
})
