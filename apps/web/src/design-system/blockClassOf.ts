export type BlockHue = 'peach' | 'mint' | 'periwinkle' | 'lavender'

const hueClasses: Readonly<Record<BlockHue, string>> = {
  peach: 'bg-block-peach',
  mint: 'bg-block-mint',
  periwinkle: 'bg-block-periwinkle',
  lavender: 'bg-block-lavender',
}

const huesInOrder: ReadonlyArray<BlockHue> = ['peach', 'mint', 'periwinkle', 'lavender']

export function hueClassOf(hue: BlockHue): string {
  return hueClasses[hue]
}

export function blockHueOf(index: number): BlockHue {
  return huesInOrder[index % huesInOrder.length] ?? 'peach'
}
