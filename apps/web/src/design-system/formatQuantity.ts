const narrowNoBreakSpace = '\u202f'

export function formatQuantity(quantity: number): string {
  return String(Math.floor(quantity)).replace(/\B(?=(\d{3})+(?!\d))/g, narrowNoBreakSpace)
}
