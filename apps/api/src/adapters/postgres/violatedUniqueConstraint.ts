import { DatabaseError } from 'pg'

const uniqueViolation = '23505'

export const violatedUniqueConstraint = (failure: unknown): string | undefined =>
  failure instanceof Error &&
  failure.cause instanceof DatabaseError &&
  failure.cause.code === uniqueViolation
    ? failure.cause.constraint
    : undefined
