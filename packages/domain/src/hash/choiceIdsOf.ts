import { mixed32 } from './mixed32'

const HEX_DIGITS = 8

const hexOf = (hash: number): string => hash.toString(16).padStart(HEX_DIGITS, '0')

type Hashed = { readonly hash: number }

export const choiceIdsOf = <T extends Hashed>(
  hashed: ReadonlyArray<T>,
): ReadonlyArray<T & { readonly choiceId: string }> => {
  const chosen: Array<T & { readonly choiceId: string }> = []
  for (const item of hashed) {
    let candidate = item.hash
    while (chosen.some(({ choiceId }) => choiceId === hexOf(candidate))) {
      candidate = mixed32(candidate)
    }
    chosen.push({ ...item, choiceId: hexOf(candidate) })
  }
  return chosen
}
