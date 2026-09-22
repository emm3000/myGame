const thinSpace = ' '

export function formatQuantity(quantity: number): string {
  return String(Math.floor(quantity)).replace(/\B(?=(\d{3})+(?!\d))/g, thinSpace)
}
