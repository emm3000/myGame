import { render } from '@testing-library/react'
import { expect, it } from 'vitest'
import { SceneBand } from './SceneBand'

it('hides the scene band from assistive technology', () => {
  const { container } = render(<SceneBand terrain="lowlands" season={null} artSrc={undefined} />)

  const band = container.firstElementChild
  expect(band?.getAttribute('aria-hidden')).toBe('true')
  expect(band?.textContent).toBe('')
})

it('draws the raster scene over the drawing when one is listed', () => {
  const { container } = render(
    <SceneBand terrain="ridges" season="winter" artSrc="/art/scenes/ridges.webp" />,
  )

  const raster = container.querySelector('img')
  expect(raster?.getAttribute('src')).toBe('/art/scenes/ridges.webp')
  expect(raster?.getAttribute('alt')).toBe('')
  expect(raster?.previousElementSibling?.tagName).toBe('svg')
})

it('draws no raster scene when none is listed', () => {
  const { container } = render(<SceneBand terrain="ridges" season="winter" artSrc={undefined} />)

  expect(container.querySelector('img')).toBeNull()
  expect(container.querySelector('svg')).not.toBeNull()
})

const veilFillsOf = (container: HTMLElement): ReadonlyArray<string> =>
  [...(container.querySelector('img')?.nextElementSibling?.querySelectorAll('rect') ?? [])].map(
    (rect) => `${rect.getAttribute('fill')} ${rect.getAttribute('fill-opacity')}`,
  )

it('dims the raster scene with the surface at 35 %', () => {
  const { container } = render(
    <SceneBand terrain="lowlands" season={null} artSrc="/art/scenes/lowlands.webp" />,
  )

  expect(veilFillsOf(container)).toEqual(['var(--surface) 0.35'])
})

it('tints the raster scene with the season as the drawing tints its sky', () => {
  const { container } = render(
    <SceneBand terrain="ridges" season="winter" artSrc="/art/scenes/ridges.webp" />,
  )

  expect(veilFillsOf(container)).toEqual(['var(--surface) 0.35', 'var(--slate) 0.34'])
})
