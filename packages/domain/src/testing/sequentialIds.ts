import type { IdGenerator } from '../ports/IdGenerator'

export const sequentialIds = (prefix = 'fief'): IdGenerator => {
  let issued = 0
  return {
    newId: (): string => {
      issued += 1
      return `${prefix}-${issued}`
    },
  }
}
