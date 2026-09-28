import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { compile } from '@tailwindcss/node'
import { expect, it } from 'vitest'
import { minHeights, palette, radii, shadows, spacing, widths } from './tokens'

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
