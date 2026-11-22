import { describe, expect, it } from 'vitest'
import { apiPackagePath } from '#apiPackagePath.testSupport'
import { clauseLinkingStructures } from './clauseLinkingStructures'
import { readGateContent } from './readGateContent'

describe('the clause-linking structures', () => {
  it('names only structures the shipped grammar holds', () => {
    const shippedNames = readGateContent(apiPackagePath('content/')).grammar.structures.map(
      ({ name }) => name,
    )

    expect([...clauseLinkingStructures].filter((name) => !shippedNames.includes(name))).toEqual([])
  })
})
