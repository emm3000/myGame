import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { Block } from './Block'
import type { BlockHue } from './blockClassOf'

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

it('writes in on-block on every hue, since ink flips in dark', () => {
  expect(showBlock('mint').className.split(' ')).toContain('text-on-block')
})

it('draws no border', () => {
  expect(showBlock('mint').className.split(' ')).not.toContain('border')
})
