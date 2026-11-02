import type { Refusal } from './Refusal'

type ParseIssue = {
  readonly path: ReadonlyArray<PropertyKey>
  readonly code: string
}

export type NamedIssue = readonly [field: string, code: string, refusal: Refusal]

export const requestRefusalOf = (
  namedIssues: ReadonlyArray<NamedIssue>,
  issues: ReadonlyArray<ParseIssue>,
): Refusal =>
  namedIssues.find(([field, code]) =>
    issues.some((issue) => issue.path[0] === field && issue.code === code),
  )?.[2] ?? { kind: 'MalformedRequest' }
