import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { compile } from '@tailwindcss/node'
import { expect, it } from 'vitest'
import {
  durations,
  easings,
  heights,
  maxWidths,
  minHeights,
  palette,
  radii,
  sizes,
  spacing,
  transitions,
  typeFamilies,
  typeScale,
  widths,
} from './tokens'

async function compileStylesheet(): Promise<Awaited<ReturnType<typeof compile>>> {
  const base = join(import.meta.dirname, '..')
  return compile(await readFile(join(base, 'styles.css'), 'utf8'), {
    base,
    onDependency: () => {},
  })
}

it('exposes a Tailwind colour for every palette token', async () => {
  const stylesheet = await compileStylesheet()
  const tokens = Object.keys(palette)

  const css = stylesheet.build(tokens.map((token) => `bg-${token}`))

  expect(tokens.filter((token) => !css.includes(`.bg-${token} {`))).toEqual([])
})

it('exposes a Tailwind spacing utility for every spacing step', async () => {
  const stylesheet = await compileStylesheet()
  const steps = Object.keys(spacing)

  const css = stylesheet.build(steps.map((step) => `p-${step}`))

  expect(steps.filter((step) => !css.includes(`.p-${step} {`))).toEqual([])
})

it('exposes a Tailwind radius utility for every radius token', async () => {
  const stylesheet = await compileStylesheet()
  const names = Object.keys(radii)

  const css = stylesheet.build(names.map((name) => `rounded-${name}`))

  expect(names.filter((name) => !css.includes(`.rounded-${name} {`))).toEqual([])
})

it('exposes a Tailwind min-height utility for every min-height token', async () => {
  const stylesheet = await compileStylesheet()
  const names = Object.keys(minHeights)

  const css = stylesheet.build(names.map((name) => `min-h-${name}`))

  expect(names.filter((name) => !css.includes(`.min-h-${name} {`))).toEqual([])
})

it('exposes a Tailwind width utility for every width token', async () => {
  const stylesheet = await compileStylesheet()
  const names = Object.keys(widths)

  const css = stylesheet.build(names.map((name) => `w-${name}`))

  expect(names.filter((name) => !css.includes(`.w-${name} {`))).toEqual([])
})

it('exposes a Tailwind height utility for every height token', async () => {
  const stylesheet = await compileStylesheet()
  const names = Object.keys(heights)

  const css = stylesheet.build(names.map((name) => `h-${name}`))

  expect(names.filter((name) => !css.includes(`.h-${name} {`))).toEqual([])
})

it('exposes a Tailwind size utility for every size token', async () => {
  const stylesheet = await compileStylesheet()
  const names = Object.keys(sizes)

  const css = stylesheet.build(names.map((name) => `size-${name}`))

  expect(names.filter((name) => !css.includes(`.size-${name} {`))).toEqual([])
})

it('exposes a Tailwind transition utility for every transition token', async () => {
  const stylesheet = await compileStylesheet()
  const entries = Object.entries(transitions)

  const css = stylesheet.build(entries.map(([name]) => `transition-${name}`))

  expect(entries.filter(([, value]) => !css.includes(`transition: ${value}`))).toEqual([])
})

it('runs the skeleton pulse over calm, there and back forever', async () => {
  const stylesheet = await compileStylesheet()

  const css = stylesheet.build(['motion-safe:animate-skeleton-pulse'])

  expect(css).toContain(
    `animation: skeleton-pulse ${durations.calm} ${easings.standard} infinite alternate`,
  )
})

it('applies the skeleton pulse only when motion is allowed', async () => {
  const stylesheet = await compileStylesheet()

  const css = stylesheet.build(['motion-safe:animate-skeleton-pulse'])

  const motionQuery = css.indexOf('@media (prefers-reduced-motion: no-preference)')
  expect(motionQuery).toBeGreaterThan(-1)
  expect(css.indexOf('animation: skeleton-pulse')).toBeGreaterThan(motionQuery)
})

it('starts the skeleton pulse on surface-sunken', async () => {
  const stylesheet = await compileStylesheet()

  const css = stylesheet.build(['motion-safe:animate-skeleton-pulse'])

  expect(ruleOf(css, '@keyframes skeleton-pulse')).toContain(
    'background-color: var(--surface-sunken)',
  )
})

it('peaks the skeleton pulse half way to surface, so it never fades into the background', async () => {
  const stylesheet = await compileStylesheet()

  const css = stylesheet.build(['motion-safe:animate-skeleton-pulse'])

  expect(css).toContain(
    'background-color: color-mix(in srgb, var(--surface-sunken), var(--surface) 50%)',
  )
  expect(css).not.toMatch(/background-color: var\(--surface\)/)
})

function ruleOf(css: string, selector: string): string {
  const start = css.indexOf(`${selector} {`)
  return start === -1 ? '' : css.slice(start, css.indexOf('}', start))
}

it('exposes a Tailwind max-width utility for every max-width token', async () => {
  const stylesheet = await compileStylesheet()
  const names = Object.keys(maxWidths)

  const css = stylesheet.build(names.map((name) => `max-w-${name}`))

  expect(names.filter((name) => !css.includes(`.max-w-${name} {`))).toEqual([])
})

it('sets every type style, never a colour, through its text utility', async () => {
  const stylesheet = await compileStylesheet()
  const entries = Object.entries(typeScale)

  const css = stylesheet.build(entries.map(([style]) => `text-${style}`))

  expect(
    entries
      .filter(([style, { fontSize }]) => {
        const rule = ruleOf(css, `.text-${style}`)
        return !rule.includes(`font-size: ${fontSize}`) || rule.includes('color:')
      })
      .map(([style]) => style),
  ).toEqual([])
})

it('sets the one type family through font-sans', async () => {
  const stylesheet = await compileStylesheet()

  const css = stylesheet.build(['font-sans'])

  expect(ruleOf(css, '.font-sans')).toContain(`font-family: ${typeFamilies.sans}`)
})

it('raises the word style to its larger size from md', async () => {
  const stylesheet = await compileStylesheet()

  const css = stylesheet.build(['text-word'])
  const mediaRule = css.slice(css.indexOf('@media (min-width: 48rem)'))

  expect(ruleOf(css, '.text-word')).toContain('font-size: 44px')
  expect(mediaRule).toContain('font-size: 52px')
  expect(css.indexOf('font-size: 44px')).toBeLessThan(css.indexOf('font-size: 52px'))
})

it('sets meta alone in uppercase', async () => {
  const stylesheet = await compileStylesheet()
  const styles = Object.keys(typeScale)

  const css = stylesheet.build(styles.map((style) => `text-${style}`))

  expect(css.match(/text-transform: uppercase/g)).toHaveLength(1)
  expect(css.slice(css.indexOf('.text-meta'))).toContain('text-transform: uppercase')
})

it('sets numeral alone with tabular figures', async () => {
  const stylesheet = await compileStylesheet()
  const styles = Object.keys(typeScale)

  const css = stylesheet.build(styles.map((style) => `text-${style}`))

  expect(css.match(/font-variant-numeric: tabular-nums/g)).toHaveLength(1)
  expect(css.slice(css.indexOf('.text-numeral'))).toContain('font-variant-numeric: tabular-nums')
})
