import type { FixedCopyKey } from './fixedCopyKeys'

type FunctionNameOf<Key extends string> = Key extends `${infer Head}.${infer Rest}`
  ? `${Head}${Capitalize<FunctionNameOf<Rest>>}`
  : Key

export type FixedCopyName = FunctionNameOf<FixedCopyKey>
