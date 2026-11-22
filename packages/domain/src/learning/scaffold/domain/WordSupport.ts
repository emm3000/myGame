import type { SupportLevel } from './supportLevelOf'
import type { SupportText } from './supportTextOf'

export type WordSupport = SupportText & Pick<SupportLevel, 'shown'>
