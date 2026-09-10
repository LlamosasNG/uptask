import mongoose from 'mongoose'
import { vi } from 'vitest'

// Keep the driver's real abort/retry/commit machinery. Fail only after the
// application callback has completed its writes, when document state is dirty.
export function failTransactionAfterWrites(kind: 'transient' | 'permanent') {
  const startSession = mongoose.startSession.bind(mongoose)
  vi.spyOn(mongoose, 'startSession').mockImplementationOnce(async (...args) => {
    const session = await startSession(...args)
    const withTransaction = session.withTransaction.bind(session)
    let attempts = 0
    vi.spyOn(session, 'withTransaction').mockImplementation((callback, options) =>
      withTransaction(async (activeSession) => {
        const result = await callback(activeSession)
        if (attempts++ === 0) {
          const error = new mongoose.mongo.MongoServerError({ message: 'Injected failure after writes' })
          if (kind === 'transient') error.addErrorLabel('TransientTransactionError')
          throw error
        }
        return result
      }, options)
    )
    return session
  })
}
