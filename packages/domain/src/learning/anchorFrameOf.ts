import type { LessonWord, WordFrame } from './Lesson'

export const anchorFrameOf = ({ frames: [anchor] }: LessonWord): WordFrame => anchor
