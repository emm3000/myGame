const codeOf = ({ cause }: Error): string | undefined =>
  typeof cause === 'object' && cause !== null && 'code' in cause && typeof cause.code === 'string'
    ? cause.code
    : undefined

export const thrownCauseOf = (error: Error): string => {
  const code = codeOf(error)
  return code === undefined ? error.constructor.name : `${error.constructor.name} ${code}`
}
