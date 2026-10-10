import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { compile } from '@tailwindcss/node'
import { expect, it } from 'vitest'
import {
  heights,
  maxHeights,
  minHeights,
  palette,
  radii,
  shadows,
  sizes,
  spacing,
  transitions,
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

it('exposes a Tailwind shadow utility for every shadow token', async () => {
  const stylesheet = await compileStylesheet()
  const names = Object.keys(shadows)

  const css = stylesheet.build(names.map((name) => `shadow-${name}`))

  expect(names.filter((name) => !css.includes(`.shadow-${name} {`))).toEqual([])
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

it('exposes a Tailwind max-h-band utility', async () => {
  const stylesheet = await compileStylesheet()
  const names = Object.keys(maxHeights)

  const css = stylesheet.build(names.map((name) => `max-h-${name}`))

  expect(names).toEqual(['band'])
  expect(names.filter((name) => !css.includes(`.max-h-${name} {`))).toEqual([])
})

it('exposes a Tailwind transition utility for every transition token', async () => {
  const stylesheet = await compileStylesheet()
  const entries = Object.entries(transitions)

  const css = stylesheet.build(entries.map(([name]) => `transition-${name}`))

  expect(entries.filter(([, value]) => !css.includes(`transition: ${value}`))).toEqual([])
})

function ruleOf(css: string, selector: string): string {
  const start = css.indexOf(`${selector} {`)
  return start === -1 ? '' : css.slice(start, css.indexOf('}', start))
}

it('switches every shadow token with the theme', async () => {
  const stylesheet = await compileStylesheet()
  const names = Object.keys(shadows)
  const declarations = Object.entries(shadows).flatMap(([name, byTheme]) =>
    Object.values(byTheme).map((value) => `--shadow-${name}: ${value}`),
  )

  const css = stylesheet.build(names.map((name) => `shadow-${name}`))

  expect(declarations.filter((declaration) => !css.includes(declaration))).toEqual([])
  expect(
    names.filter((name) => !ruleOf(css, `.shadow-${name}`).includes(`var(--shadow-${name})`)),
  ).toEqual([])
})
