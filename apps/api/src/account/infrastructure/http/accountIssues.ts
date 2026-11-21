import type { NamedIssue } from '#platform/infrastructure/http/requestRefusalOf'

export const accountIssues: ReadonlyArray<NamedIssue> = [
  ['email', 'invalid_format', { kind: 'MalformedEmail' }],
  ['password', 'too_small', { kind: 'WeakPassword' }],
]
