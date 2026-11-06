export type WayOn =
  | { readonly kind: 'lesson'; readonly lessonId: string }
  | { readonly kind: 'reviews' }

export const wayOnOf = (readFirst: ReadonlyArray<string>, opened: ReadonlyArray<string>): WayOn => {
  const lessonId = readFirst.find((unread) => !opened.includes(unread))
  return lessonId === undefined ? { kind: 'reviews' } : { kind: 'lesson', lessonId }
}
