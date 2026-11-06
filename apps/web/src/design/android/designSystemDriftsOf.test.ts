import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { designSystemDirectory } from './designSystemDirectory'
import { designSystemDriftsOf } from './designSystemDriftsOf'

let copiedDirectory = ''

beforeEach(() => {
  copiedDirectory = mkdtempSync(join(tmpdir(), 'core-designsystem-'))
  cpSync(designSystemDirectory, copiedDirectory, { recursive: true })
})

afterEach(() => {
  rmSync(copiedDirectory, { recursive: true })
})

it('keeps core:designsystem as generated from tokens.ts', () => {
  expect(designSystemDriftsOf(designSystemDirectory)).toEqual([])
})

it('fails on a drifted value in core:designsystem', () => {
  const radii = join(copiedDirectory, 'MyGameRadii.kt')
  writeFileSync(radii, readFileSync(radii, 'utf8').replace('16.dp', '17.dp'))

  expect(designSystemDriftsOf(copiedDirectory)).toEqual(['MyGameRadii.kt drifted from tokens.ts'])
})

it('fails on a generated file that is missing', () => {
  rmSync(join(copiedDirectory, 'MyGameColors.kt'))

  expect(designSystemDriftsOf(copiedDirectory)).toEqual(['MyGameColors.kt is missing'])
})
