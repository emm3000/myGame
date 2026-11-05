import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { assert, describe, expect, it } from 'vitest'
import type { Messages } from './Messages'
import { typeScriptOf } from './typeScriptOf'

const generatedModuleOf = async (messages: Messages): Promise<Record<string, unknown>> => {
  const path = join(mkdtempSync(join(tmpdir(), 'catalog-')), 'messages.ts')
  writeFileSync(path, typeScriptOf(messages))
  return import(path)
}

const rendered = (module: Record<string, unknown>, name: string, args?: object): string => {
  const message = module[name]
  assert(typeof message === 'function')
  return String(message(args))
}

describe('typeScriptOf', () => {
  it('names each function by the camelCase join of its key', async () => {
    const refusal = { 'refusal.InvalidCredentials': 'Correo o contraseña incorrectos.' }

    const module = await generatedModuleOf(refusal)

    expect(rendered(module, 'refusalInvalidCredentials')).toBe('Correo o contraseña incorrectos.')
  })

  it('declares a message without arguments as a function of none', () => {
    const subject = { 'mail.reset.subject': 'Cambia tu contraseña' }

    expect(typeScriptOf(subject)).toContain('export const mailResetSubject = (): string =>')
  })

  it('keeps line breaks, backticks, backslashes and dollar signs as written', async () => {
    const tricky = { 'fief.tricky': "Uno\n`dos` \\ $'{'tres'}'" }

    const module = await generatedModuleOf(tricky)

    expect(rendered(module, 'fiefTricky')).toBe(['Uno\n`dos` \\ $', '{tres}'].join(''))
  })

  it('renders a simple argument with String', async () => {
    const fillsAt = { 'fief.fillsAt': 'Se llena a las {time}.' }

    const module = await generatedModuleOf(fillsAt)

    expect(rendered(module, 'fiefFillsAt', { time: 12 })).toBe('Se llena a las 12.')
  })

  it('types a simple argument as a string or a number', () => {
    const fillsAt = { 'fief.fillsAt': 'Se llena a las {time}.' }

    expect(typeScriptOf(fillsAt)).toContain('{ readonly time: string | number }')
  })

  it('picks an exact plural selector before other', async () => {
    const peasants = {
      'fief.peasants': '{count, plural, =0 {nadie} =1 {un campesino} other {# campesinos}}',
    }

    const module = await generatedModuleOf(peasants)

    expect([0, 1, 7].map((count) => rendered(module, 'fiefPeasants', { count }))).toEqual([
      'nadie',
      'un campesino',
      '7 campesinos',
    ])
  })

  it('types a plural argument as a number', () => {
    const peasants = { 'fief.peasants': '{count, plural, =1 {uno} other {#}}' }

    expect(typeScriptOf(peasants)).toContain('{ readonly count: number }')
  })

  it('picks a select option by its key', async () => {
    const order = {
      'march.order': '{order, select, forage {forrajeo} attack {ataque} other {marcha}}',
    }

    const module = await generatedModuleOf(order)

    expect(rendered(module, 'marchOrder', { order: 'attack' })).toBe('ataque')
  })

  it('types a select argument as the union of its explicit keys', () => {
    const order = {
      'march.order': '{order, select, forage {forrajeo} attack {ataque} other {marcha}}',
    }

    expect(typeScriptOf(order)).toContain(`{ readonly order: 'forage' | 'attack' }`)
  })

  it('refuses a plural category that needs runtime plural rules', () => {
    const categorical = { 'fief.peasants': '{count, plural, one {uno} other {#}}' }

    expect(() => typeScriptOf(categorical)).toThrow(/fief\.peasants/)
  })

  it('refuses a number skeleton', () => {
    const skeleton = { 'fief.wood': '{amount, number, integer}' }

    expect(() => typeScriptOf(skeleton)).toThrow(/fief\.wood/)
  })

  it('refuses a tag', () => {
    const tagged = { 'fief.bold': 'Una <b>palabra</b>' }

    expect(() => typeScriptOf(tagged)).toThrow(/fief\.bold/)
  })

  it('refuses one argument used in two roles', () => {
    const twoRoles = { 'fief.count': '{count} {count, plural, =1 {uno} other {varios}}' }

    expect(() => typeScriptOf(twoRoles)).toThrow(/fief\.count/)
  })

  it('refuses a key outside the dotted camelCase shape', () => {
    const snakeKey = { 'fief.fills_at': 'Se llena' }

    expect(() => typeScriptOf(snakeKey)).toThrow(/fief\.fills_at/)
  })

  it('leaves the android keys out', () => {
    const androidOnly = { 'android.signin.sign_in_title': 'Entra en tu feudo' }

    expect(typeScriptOf(androidOnly)).not.toContain('Entra en tu feudo')
  })
})
