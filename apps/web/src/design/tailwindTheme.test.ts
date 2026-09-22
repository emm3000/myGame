import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { compile } from '@tailwindcss/node'
import { expect, it } from 'vitest'
import { palette, spacing } from './tokens'

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
