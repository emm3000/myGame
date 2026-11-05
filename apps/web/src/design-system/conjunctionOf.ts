const listFormat = new Intl.ListFormat('es', { type: 'conjunction' })

export function conjunctionOf(items: ReadonlyArray<string>): string {
  return listFormat.format(items)
}
