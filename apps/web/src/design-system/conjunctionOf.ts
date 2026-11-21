export function conjunctionOf(
  { locale }: { readonly locale: string },
  items: ReadonlyArray<string>,
): string {
  return new Intl.ListFormat(locale, { type: 'conjunction' }).format(items)
}
