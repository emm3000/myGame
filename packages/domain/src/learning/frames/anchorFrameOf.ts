import type { LessonWord } from '../Lesson'
import type { WordFrame } from './WordFrame'

export const anchorFrameOf = ({ frames: [anchor] }: LessonWord): WordFrame => anchor
