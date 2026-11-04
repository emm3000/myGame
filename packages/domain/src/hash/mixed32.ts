export const mixed32 = (value: number): number => {
  const first = Math.imul(value ^ (value >>> 16), 0x7feb352d)
  const second = Math.imul(first ^ (first >>> 15), 0x846ca68b)
  return (second ^ (second >>> 16)) >>> 0
}
