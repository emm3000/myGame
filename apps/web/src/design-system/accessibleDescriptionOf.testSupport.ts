export function accessibleDescriptionOf(element: HTMLElement): string {
  const ids = element.getAttribute('aria-describedby')?.split(' ') ?? []
  return ids.map((id) => document.getElementById(id)?.textContent ?? '').join(' ')
}
