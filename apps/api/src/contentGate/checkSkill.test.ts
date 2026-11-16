import { fileURLToPath } from 'node:url'
import type { CurriculumContent } from '@mygame/contracts'
import { describe, expect, it } from 'vitest'
import { checkSkill } from './checkSkill'
import { contentOf } from './contentGate.testSupport'
import { gateContentOf } from './gateContentOf'

const shippedContent = fileURLToPath(new URL('../../content/', import.meta.url))

const skillOf = (skill: CurriculumContent['skill']): ReturnType<typeof contentOf> =>
  contentOf({ skill })

describe('content gate check 10, the skill', () => {
  it('passes the shipped curriculum', () => {
    expect(checkSkill(gateContentOf(shippedContent))).toEqual([])
  })

  it('refuses a skill on food', () => {
    expect(checkSkill(skillOf({ resource: 'food', ratePercent: 5 }))).toEqual([
      'skill raises food, not money',
    ])
  })

  it('refuses a rate of 6 %', () => {
    expect(checkSkill(skillOf({ resource: 'money', ratePercent: 6 }))).toEqual([
      'skill rate is 6 %, not 5 %',
    ])
  })
})
