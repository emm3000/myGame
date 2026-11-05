import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { checkSkill } from './checkSkill'
import { contentOf } from './contentGate.testSupport'
import { gateContentOf } from './gateContentOf'

const shippedContent = fileURLToPath(new URL('../../content/', import.meta.url))

const skillOf = (cycle: ReadonlyArray<string>, ratePercent = 5): ReturnType<typeof contentOf> =>
  contentOf({ skill: { cycle: cycle as never, ratePercent } })

describe('content gate check 10, the skill', () => {
  it('passes the shipped curriculum', () => {
    expect(checkSkill(gateContentOf(shippedContent))).toEqual([])
  })

  it('fails a cycle that misses a resource', () => {
    expect(checkSkill(skillOf(['food', 'material', 'power']))).toEqual(['skill cycle misses money'])
  })

  it('fails a cycle that names a resource twice', () => {
    expect(checkSkill(skillOf(['food', 'material', 'power', 'money', 'power']))).toEqual([
      'skill cycle names power more than once',
    ])
  })

  it('fails a cycle that does not start at food', () => {
    expect(checkSkill(skillOf(['material', 'food', 'power', 'money']))).toEqual([
      'skill cycle starts at material, not food',
    ])
  })

  it('fails a rate other than 5 %', () => {
    expect(checkSkill(skillOf(['food', 'material', 'power', 'money'], 10))).toEqual([
      'skill rate is 10 %, not 5 %',
    ])
  })
})
