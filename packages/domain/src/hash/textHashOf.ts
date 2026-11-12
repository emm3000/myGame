import { mixed32 } from './mixed32'

export const textHashOf = (text: string, seed: number): number =>
  [...text].reduce((hash, character) => mixed32(hash ^ (character.codePointAt(0) ?? 0)), seed)
