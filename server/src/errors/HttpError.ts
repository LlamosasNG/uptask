export type ErrorFields = Record<string, string>

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fields?: ErrorFields
  ) {
    super(message)
    this.name = 'HttpError'
  }
}
