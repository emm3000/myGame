import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { compile } from '@tailwindcss/node'
import { expect, it } from 'vitest'
import {
  heights,
  minHeights,
  palette,
  radii,
  shadows,
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

it('exposes a Tailwind transition utility for every transition token', async () => {
  const stylesheet = await compileStylesheet()
  const entries = Object.entries(transitions)

  const css = stylesheet.build(entries.map(([name]) => `transition-${name}`))

  expect(entries.filter(([, value]) => !css.includes(`transition: ${value}`))).toEqual([])
})

it('switches every shadow token with the theme', async () => {
  const stylesheet = await compileStylesheet()
  const declarations = Object.entries(shadows).flatMap(([name, byTheme]) =>
    Object.values(byTheme).map((value) => `--shadow-${name}: ${value}`),
  )

  const css = stylesheet.build([])

  expect(declarations.filter((declaration) => !css.includes(declaration))).toEqual([])
})
