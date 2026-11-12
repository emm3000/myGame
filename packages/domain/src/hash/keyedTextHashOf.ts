import { mixed32 } from './mixed32'
import { textHashOf } from './textHashOf'

const HIGH_WORD = 2 ** 32

export const keyedTextHashOf = (text: string, keyMilliseconds: number): number => {
  const seed = mixed32(mixed32(keyMilliseconds >>> 0) ^ Math.floor(keyMilliseconds / HIGH_WORD))
  return textHashOf(text, seed)
}
