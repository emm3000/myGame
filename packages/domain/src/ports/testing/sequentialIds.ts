import type { IdGenerator } from '../IdGenerator'

export const sequentialIds = (prefix: string): IdGenerator => {
  let issued = 0
  return {
    newId: (): string => {
      issued += 1
      return `${prefix}-${issued}`
    },
  }
}
