import type { FiefOverview } from '@mygame/contracts'
import { act, cleanup, fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ApiClient } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import {
  knownFief,
  knownFiefPath,
  knownPlayer,
  stubApiClient,
} from '../auth/stubApiClient.testSupport'
import { copy } from '../copy'
import { stubNotification } from './stubNotification.testSupport'

const readAt = new Date(knownFief.readAt)

beforeEach(() => {
  vi.useFakeTimers({ now: readAt })
  localStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const passSeconds = async (seconds: number): Promise<void> => {
  await act(() => vi.advanceTimersByTimeAsync(seconds * 1000))
}

const clientServing = (reads: ReadonlyArray<FiefOverview>): ApiClient => {
  const pending = [...reads]
  return stubApiClient({
    currentPlayer: async () => knownPlayer,
    fief: () => {
      const next = pending.shift()
      return next === undefined
        ? new Promise(() => undefined)
        : Promise.resolve({ ok: true, value: next })
    },
  })
}

const showFief = async (apiClient: ApiClient): Promise<void> => {
  renderAppAt(knownFiefPath, apiClient)
  await passSeconds(0)
}

const avisarme = (): HTMLElement => screen.getByRole('switch', { name: copy.status.notices.label })

const clickAvisarme = async (): Promise<void> => {
  fireEvent.click(avisarme())
  await passSeconds(0)
}

const sawmillFinishingInThirtySeconds: FiefOverview = {
  ...knownFief,
  slot: {
    kind: 'busy',
    building: 'sawmill',
    targetLevel: 2,
    startedAt: '2026-09-22T11:58:00.000Z',
    finishesAt: '2026-09-22T12:00:30.000Z',
  },
}

const sawmillFinished: FiefOverview = {
  ...knownFief,
  buildings: { ...knownFief.buildings, sawmill: { ...knownFief.buildings.sawmill, level: 2 } },
  readAt: '2026-09-22T12:00:30.000Z',
}

const sawmillFinishedRereadLater: FiefOverview = {
  ...sawmillFinished,
  readAt: '2026-09-22T12:01:30.000Z',
}

it('notifies a finished upgrade once the re-read shows it applied', async () => {
  const notifications = stubNotification('default', 'granted')
  await showFief(
    clientServing([sawmillFinishingInThirtySeconds, sawmillFinished, sawmillFinishedRereadLater]),
  )
  await clickAvisarme()

  await passSeconds(90)

  expect(notifications.sent.map(({ title, body }) => ({ title, body }))).toEqual([
    { title: 'Fuenteclara', body: 'Obra terminada: aserradero, nivel 2.' },
  ])
})

it('sends nothing at the countdown zero before the re-read', async () => {
  const notifications = stubNotification('default', 'granted')
  await showFief(clientServing([sawmillFinishingInThirtySeconds]))
  await clickAvisarme()

  await passSeconds(30)

  expect(notifications.sent).toEqual([])
})

it('sends nothing on the first read of a visit', async () => {
  const notifications = stubNotification('default', 'granted')
  await showFief(clientServing([sawmillFinishingInThirtySeconds, sawmillFinished]))
  await clickAvisarme()
  cleanup()

  await showFief(clientServing([sawmillFinished, sawmillFinishedRereadLater]))
  await passSeconds(60)

  expect(notifications.sent).toEqual([])
})

it('sends nothing while Avisarme is off', async () => {
  const notifications = stubNotification('granted')
  await showFief(clientServing([sawmillFinishingInThirtySeconds, sawmillFinished]))

  await passSeconds(30)

  expect(notifications.sent).toEqual([])
})

it('sends nothing once the browser permission is withdrawn', async () => {
  const notifications = stubNotification('default', 'granted')
  await showFief(clientServing([sawmillFinishingInThirtySeconds, sawmillFinished]))
  await clickAvisarme()
  notifications.setPermission('denied')

  await passSeconds(30)

  expect(notifications.sent).toEqual([])
})

it('asks the browser permission when Avisarme is turned on', async () => {
  const notifications = stubNotification('default', 'granted')
  await showFief(clientServing([knownFief]))

  await clickAvisarme()

  expect(notifications.requestPermission).toHaveBeenCalledTimes(1)
  expect(avisarme().getAttribute('aria-checked')).toBe('true')
})

it('stays off when the permission is denied', async () => {
  stubNotification('default', 'denied')
  await showFief(clientServing([knownFief]))

  await clickAvisarme()

  expect(avisarme().getAttribute('aria-checked')).toBe('false')
  expect(screen.getByRole('alert').textContent).toBe(copy.status.notices.denied)
})

it('stays off where the browser has no notifications', async () => {
  vi.stubGlobal('Notification', undefined)
  Reflect.deleteProperty(globalThis, 'Notification')
  await showFief(clientServing([knownFief]))

  await clickAvisarme()

  expect(avisarme().getAttribute('aria-checked')).toBe('false')
  expect(screen.getByRole('alert').textContent).toBe(copy.status.notices.denied)
})

it('keeps the choice across reloads', async () => {
  stubNotification('default', 'granted')
  await showFief(clientServing([knownFief]))
  await clickAvisarme()
  cleanup()

  await showFief(clientServing([knownFief]))

  expect(avisarme().getAttribute('aria-checked')).toBe('true')
})

it('turns Avisarme off again', async () => {
  stubNotification('default', 'granted')
  await showFief(clientServing([knownFief]))
  await clickAvisarme()

  await clickAvisarme()

  expect(avisarme().getAttribute('aria-checked')).toBe('false')
})

const levyEndingInFiveMinutes: FiefOverview = {
  ...knownFief,
  units: { ...knownFief.units, infantry: 4 },
  recruitOrder: {
    unit: 'infantry',
    count: 12,
    delivered: 4,
    perUnitSeconds: 30,
    startedAt: '2026-09-22T11:58:00.000Z',
    endsAt: '2026-09-22T12:04:00.000Z',
  },
}

const levyCancelledByTheLord: FiefOverview = {
  ...knownFief,
  units: { ...knownFief.units, infantry: 6 },
  readAt: '2026-09-22T12:01:00.000Z',
}

it('sends nothing for a levy the lord cancelled', async () => {
  const notifications = stubNotification('default', 'granted')
  await showFief(clientServing([levyEndingInFiveMinutes, levyCancelledByTheLord]))
  await clickAvisarme()

  await passSeconds(60)

  expect(notifications.sent).toEqual([])
})

it('turns Avisarme off once the browser permission is withdrawn', async () => {
  const notifications = stubNotification('default', 'granted')
  await showFief(clientServing([sawmillFinishingInThirtySeconds, sawmillFinished]))
  await clickAvisarme()
  notifications.setPermission('denied')

  await passSeconds(30)

  expect(avisarme().getAttribute('aria-checked')).toBe('false')
})

const barracksLevying: FiefOverview = {
  ...levyEndingInFiveMinutes,
  buildings: { ...knownFief.buildings, barracks: { ...knownFief.buildings.barracks, level: 1 } },
  recruitOrder: {
    unit: 'infantry',
    count: 12,
    delivered: 10,
    perUnitSeconds: 30,
    startedAt: '2026-09-22T11:54:30.000Z',
    endsAt: '2026-09-22T12:00:30.000Z',
  },
  units: { ...knownFief.units, infantry: 10 },
}

const levyCancelledAtTheBarracks: FiefOverview = {
  ...barracksLevying,
  recruitOrder: null,
  readAt: '2026-09-22T12:00:05.000Z',
}

const levyRereadAfterItsEnd: FiefOverview = {
  ...levyCancelledAtTheBarracks,
  units: { ...knownFief.units, infantry: 12 },
  readAt: '2026-09-22T12:01:05.000Z',
}

const cancelTheLevy = async (): Promise<void> => {
  fireEvent.click(screen.getByRole('button', { name: copy.army.cancelOf('infantry', 12) }))
  await passSeconds(0)
}

it('sends nothing for a levy the lord cancels on this screen before its end', async () => {
  const notifications = stubNotification('default', 'granted')
  const reads = [barracksLevying, levyRereadAfterItsEnd]
  await showFief(
    stubApiClient({
      currentPlayer: async () => knownPlayer,
      fief: () => {
        const next = reads.shift()
        return next === undefined
          ? new Promise(() => undefined)
          : Promise.resolve({ ok: true, value: next })
      },
      cancelRecruitOrder: async () => ({ ok: true, value: levyCancelledAtTheBarracks }),
    }),
  )
  await clickAvisarme()
  await passSeconds(5)
  await cancelTheLevy()

  await passSeconds(60)

  expect(notifications.sent).toEqual([])
})

it('keeps the answered overview when an older read lands after it', async () => {
  stubNotification('default')
  const heldReads: Array<(overview: FiefOverview) => void> = []
  const reads = [barracksLevying]
  await showFief(
    stubApiClient({
      currentPlayer: async () => knownPlayer,
      fief: () => {
        const next = reads.shift()
        return next === undefined
          ? new Promise((resolve) => {
              heldReads.push((value) => resolve({ ok: true, value }))
            })
          : Promise.resolve({ ok: true, value: next })
      },
      cancelRecruitOrder: async () => ({ ok: true, value: levyCancelledAtTheBarracks }),
    }),
  )
  await passSeconds(2)
  await act(async () => {
    window.dispatchEvent(new Event('focus'))
  })
  await cancelTheLevy()

  await act(async () => {
    heldReads[0]?.({ ...barracksLevying, readAt: '2026-09-22T12:00:02.000Z' })
  })

  expect(screen.queryByRole('button', { name: copy.army.cancelOf('infantry', 12) })).toBeNull()
})
