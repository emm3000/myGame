const blockClasses = [
  'bg-block-peach',
  'bg-block-mint',
  'bg-block-periwinkle',
  'bg-block-lavender',
] as const

export function blockClassOf(index: number): string {
  return blockClasses[index % blockClasses.length] ?? blockClasses[0]
}
