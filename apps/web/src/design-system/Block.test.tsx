import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { Block } from './Block'
import type { BlockHue } from './blockHueOf'

const showBlock = (hue: BlockHue): HTMLElement => {
  render(
    <Block hue={hue} labelledBy="title">
      <h3 id="title">Next</h3>
    </Block>,
  )
  return screen.getByRole('region', { name: 'Next' })
}

it.each<BlockHue>(['peach', 'mint', 'periwinkle', 'lavender'])('carries the hue %s', (hue) => {
  expect(showBlock(hue).dataset.hue).toBe(hue)
})

it.each<BlockHue>(['peach', 'mint', 'periwinkle', 'lavender'])(
  'writes in on-block on %s, since ink flips in dark',
  (hue) => {
    expect(showBlock(hue).className.split(' ')).toContain('text-on-block')
  },
)

it('draws no border', () => {
  expect(showBlock('mint').className.split(' ')).not.toContain('border')
})
