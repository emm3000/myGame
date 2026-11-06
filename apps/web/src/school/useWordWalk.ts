import { useState } from 'react'

interface WordWalk {
  readonly lessonId: string
  readonly wordIndex: number
  readonly walked: number
}

export interface WordWalkHandle {
  readonly wordIndex: number
  readonly walked: number
  readonly walkOn: (wordIndex: number) => void
}

export function useWordWalk(lessonId: string): WordWalkHandle {
  const [held, setWalk] = useState<WordWalk>({ lessonId, wordIndex: 0, walked: 0 })
  const walk =
    held.lessonId === lessonId ? held : { lessonId, wordIndex: 0, walked: held.walked + 1 }
  if (walk !== held) {
    setWalk(walk)
  }
  return {
    wordIndex: walk.wordIndex,
    walked: walk.walked,
    walkOn: (wordIndex) => setWalk({ ...walk, wordIndex, walked: walk.walked + 1 }),
  }
}
