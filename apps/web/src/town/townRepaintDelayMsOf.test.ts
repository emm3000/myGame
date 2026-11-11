import { expect, it } from 'vitest'
import { knownTown } from '../auth/stubApiClient.testSupport'
import { liveTownAt } from './liveTown'
import { townRepaintDelayMsOf } from './townRepaintDelayMsOf'

const finishesAfter = (seconds: number): string =>
  new Date(Date.parse(knownTown.readAt) + seconds * 1000).toISOString()

const townWith = (lessonFinishSeconds: number, nextDueSeconds: number | null) =>
  liveTownAt(
    {
      ...knownTown,
      lessonSlot: {
        lessonId: 'lesson-1',
        startedAt: finishesAfter(-300),
        finishesAt: finishesAfter(lessonFinishSeconds),
      },
      nextDueAt: nextDueSeconds === null ? null : finishesAfter(nextDueSeconds),
    },
    0,
  )

it("repaints every second in a countdown's last minute", () => {
  expect(townRepaintDelayMsOf(townWith(45, null))).toBe(1000)
})

it('ignores a countdown already at zero', () => {
  expect(townRepaintDelayMsOf(townWith(0, 600))).toBe(60_000)
})

it('repaints once a minute with every countdown at zero', () => {
  expect(townRepaintDelayMsOf(townWith(0, null))).toBe(60_000)
})

const jobInstantOfPhase = {
  outbound: 'arrivesAt',
  working: 'leavesAt',
  returning: 'returnsAt',
} as const

const townWithJob = (phase: keyof typeof jobInstantOfPhase, nextSeconds: number) =>
  liveTownAt(
    {
      ...knownTown,
      job: {
        site: { region: 1, area: 1, site: 2 },
        team: { worker: 2, truck: 0 },
        hours: 1,
        pay: { money: 0, food: 40, power: 0, material: 0 },
        phase,
        sentAt: finishesAfter(-600),
        arrivesAt: finishesAfter(7200),
        leavesAt: finishesAfter(7200),
        returnsAt: finishesAfter(7200),
        [jobInstantOfPhase[phase]]: finishesAfter(nextSeconds),
        calledBackAt: null,
      },
    },
    0,
  )

it("follows the countdown to a job's arrival while its team is on the way", () => {
  expect(townRepaintDelayMsOf(townWithJob('outbound', 45))).toBe(1000)
})

it("follows the countdown to a job's leaving while its team works", () => {
  expect(townRepaintDelayMsOf(townWithJob('working', 30))).toBe(1000)
})

it("follows the countdown to a job's return while its team comes back", () => {
  expect(townRepaintDelayMsOf(townWithJob('returning', 90))).toBe(30_000)
})
