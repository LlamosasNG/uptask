import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/axios', () => ({ default: { post: vi.fn() } }))

import api from '@/lib/axios'
import { findMemberById } from './TeamAPI'

describe('findMemberById', () => {
  it('rejects malformed member data instead of exposing an unvalidated response', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { name: 'Ana', email: 'ana@example.com' } })

    await expect(
      findMemberById({ projectId: 'project-1', formData: { email: 'ana@example.com' } })
    ).rejects.toMatchObject({ code: 'SCHEMA_MISMATCH' })
  })
})
