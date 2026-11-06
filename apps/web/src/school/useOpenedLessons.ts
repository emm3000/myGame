import { useState } from 'react'

export function useOpenedLessons(lessonId: string): ReadonlyArray<string> {
  const [opened, setOpened] = useState<ReadonlyArray<string>>([lessonId])
  if (opened.includes(lessonId)) {
    return opened
  }
  const withLesson = [...opened, lessonId]
  setOpened(withLesson)
  return withLesson
}
