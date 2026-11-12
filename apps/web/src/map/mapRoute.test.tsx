import {
  mapLoading,
  refusalAreaNotFound,
  refusalInvalidTeam,
  refusalJobAlreadyReturning,
  refusalNotEnoughHiresAtHome,
  refusalTeamAlreadyOut,
  refusalUnexpected,
  townTryAgain,
} from '@mygame/catalog'
import type { RegionMap, SendJob, TownOverview } from '@mygame/contracts'
import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ApiClient } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import {
  knownAreaMap,
  knownPlayer,
  knownTown,
  stubApiClient,
} from '../auth/stubApiClient.testSupport'
import { accessibleDescriptionOf } from '../design-system/accessibleDescriptionOf.testSupport'

const reasonOf = (button: HTMLElement): HTMLElement | null =>
  document.getElementById(button.getAttribute('aria-describedby') ?? '')

const readAt = Date.parse(knownTown.readAt)

beforeEach(() => {
  vi.useFakeTimers({ now: readAt })
})

afterEach(() => {
  vi.useRealTimers()
})

const passSeconds = async (seconds: number): Promise<void> => {
  await act(() => vi.advanceTimersByTimeAsync(seconds * 1000))
}

const showMap = async (
  path: string,
  town: TownOverview,
  overrides: Partial<ApiClient> = {},
): Promise<void> => {
  renderAppAt(
    path,
    stubApiClient({
      currentPlayer: async () => knownPlayer,
      town: async () => ({ ok: true, value: town }),
      ...overrides,
    }),
  )
  await passSeconds(0)
}

const siteRow = (name: string): HTMLElement => screen.getByRole('listitem', { name })

it("opens the map on the town's area", async () => {
  const asked: Array<number | undefined> = []
  await showMap('/map', knownTown, {
    regionMap: async (area) => {
      asked.push(area)
      return { ok: true, value: knownAreaMap }
    },
  })

  expect(asked).toEqual([undefined])
  expect(screen.getByRole('heading', { level: 2, name: 'Zona 1' })).toBeDefined()
  expect(screen.getByText('Campos')).toBeDefined()
  expect(within(siteRow('Sitio 1')).getByText('Maple Falls')).toBeDefined()
  expect(within(siteRow('Sitio 1')).getByText('Tu pueblo')).toBeDefined()
  expect(within(siteRow('Sitio 2')).getByText('Libre')).toBeDefined()
  expect(
    within(siteRow('Sitio 2')).getByRole('button', { name: 'Enviar un equipo al sitio 2' }),
  ).toBeDefined()
  expect(within(siteRow('Sitio 3')).getByText('Cedar Creek')).toBeDefined()
  expect(within(siteRow('Sitio 3')).queryByRole('button')).toBeNull()
})

const areaOf = (area: number, lastArea: number): RegionMap => ({ ...knownAreaMap, area, lastArea })

const servingAreas =
  (lastArea: number, asked: Array<number | undefined> = []): ApiClient['regionMap'] =>
  async (area) => {
    asked.push(area)
    return { ok: true, value: areaOf(area ?? 1, lastArea) }
  }

const areaLink = (name: string): HTMLElement | null => screen.queryByRole('link', { name })

it('browses with previous and next', async () => {
  const asked: Array<number | undefined> = []
  await showMap('/map/2', knownTown, { regionMap: servingAreas(3, asked) })

  fireEvent.click(screen.getByRole('link', { name: 'Zona siguiente' }))
  await passSeconds(0)
  expect(screen.getByRole('heading', { level: 2, name: 'Zona 3' })).toBeDefined()

  fireEvent.click(screen.getByRole('link', { name: 'Zona anterior' }))
  await passSeconds(0)
  expect(screen.getByRole('heading', { level: 2, name: 'Zona 2' })).toBeDefined()
  expect(asked).toEqual([2, 3, 2])
})

it('offers no previous area on the first area', async () => {
  await showMap('/map', knownTown, { regionMap: servingAreas(3) })

  expect(areaLink('Zona anterior')).toBeNull()
  expect(areaLink('Zona siguiente')).not.toBeNull()
})

it('offers no next area on the last browsable area', async () => {
  await showMap('/map/3', knownTown, { regionMap: servingAreas(3) })

  expect(areaLink('Zona siguiente')).toBeNull()
  expect(areaLink('Zona anterior')).not.toBeNull()
})

it('reads an area past the last one as the end of the map, with the way back', async () => {
  await showMap('/map/9', knownTown, {
    regionMap: async (area) =>
      area === 9
        ? { ok: false, refusal: 'AreaNotFound', error: { kind: 'AreaNotFound' } }
        : { ok: true, value: knownAreaMap },
  })

  expect(screen.getByRole('alert').textContent).toBe(refusalAreaNotFound())
  fireEvent.click(screen.getByRole('link', { name: 'Volver a tu zona' }))
  await passSeconds(0)
  expect(screen.getByRole('heading', { level: 2, name: 'Zona 1' })).toBeDefined()
})

it('reads a malformed area as the end of the map without asking for it', async () => {
  const asked: Array<number | undefined> = []
  await showMap('/map/zero', knownTown, { regionMap: servingAreas(3, asked) })

  expect(screen.getByRole('alert').textContent).toBe(refusalAreaNotFound())
  expect(asked).toEqual([])
})

it('keeps the loading line in a status region while the map loads', async () => {
  await showMap('/map', knownTown, { regionMap: () => new Promise(() => undefined) })

  expect(screen.getByRole('status').textContent).toBe(mapLoading())
})

it('retries a failed read of the map', async () => {
  let reads = 0
  await showMap('/map', knownTown, {
    regionMap: async () => {
      reads += 1
      return reads === 1 ? { ok: false, refusal: 'Unexpected' } : { ok: true, value: knownAreaMap }
    },
  })
  expect(screen.getByRole('alert').textContent).toBe(refusalUnexpected())

  fireEvent.click(screen.getByRole('button', { name: townTryAgain() }))
  await passSeconds(0)

  expect(screen.getByRole('heading', { level: 2, name: 'Zona 1' })).toBeDefined()
})

it('retries a failed read of the town on the map', async () => {
  let reads = 0
  await showMap('/map', knownTown, {
    town: async () => {
      reads += 1
      return reads === 1 ? { ok: false, refusal: 'Unexpected' } : { ok: true, value: knownTown }
    },
  })

  fireEvent.click(screen.getByRole('button', { name: townTryAgain() }))
  await passSeconds(0)

  expect(screen.getByRole('heading', { level: 2, name: 'Zona 1' })).toBeDefined()
})

const instantAfter = (seconds: number): string => new Date(readAt + seconds * 1000).toISOString()

const withHires = (
  worker: number,
  truck: number,
  town: TownOverview = knownTown,
): TownOverview => ({
  ...town,
  hiring: { ...town.hiring, hires: { worker, truck } },
})

const teamAtHome = withHires(3, 1)

const jobIn = (
  phase: 'outbound' | 'working' | 'returning',
  town: TownOverview = withHires(1, 1),
): TownOverview => ({
  ...town,
  job: {
    kind: 'job',
    site: { region: 1, area: 1, site: 2 },
    team: { worker: 2, truck: 0 },
    hours: 1,
    pay: { money: 0, food: 40, power: 0, material: 20 },
    phase,
    sentAt: instantAfter(-600),
    arrivesAt: instantAfter(phase === 'outbound' ? 30 : -300),
    leavesAt: instantAfter(phase === 'returning' ? -60 : 3300),
    returnsAt: instantAfter(phase === 'returning' ? 840 : 3900),
    calledBackAt: null,
  },
})

const openJobForm = (site: number): HTMLElement => {
  fireEvent.click(screen.getByRole('button', { name: `Enviar un equipo al sitio ${site}` }))
  return screen.getByRole('region', { name: `Trabajo en el sitio ${site}` })
}

const enterTeam = (form: HTMLElement, entries: Partial<Record<string, string>>): void => {
  for (const [label, value] of Object.entries(entries)) {
    fireEvent.change(within(form).getByLabelText(label), { target: { value } })
  }
}

const sendButton = (form: HTMLElement): HTMLElement =>
  within(form).getByRole('button', { name: 'Enviar el equipo' })

const jobOut = (): HTMLElement => screen.getByRole('region', { name: 'Trabajo' })

it('sends a job from a free site', async () => {
  const sent: Array<SendJob> = []
  await showMap('/map', teamAtHome, {
    sendJob: async (job) => {
      sent.push(job)
      return { ok: true, value: jobIn('outbound') }
    },
  })

  const form = openJobForm(2)
  enterTeam(form, { 'Trabajadores a enviar': '2', 'Horas de trabajo': '4' })
  fireEvent.click(sendButton(form))
  await passSeconds(0)

  expect(sent).toEqual([{ site: { area: 1, site: 2 }, team: { worker: 2, truck: 0 }, hours: 4 }])
  expect(within(jobOut()).getByRole('timer').textContent).toContain('En camino')
  expect(screen.queryByRole('region', { name: 'Trabajo en el sitio 2' })).toBeNull()
})

it('shows the pay before sending a job', async () => {
  const quoted: Array<SendJob> = []
  await showMap('/map', teamAtHome, {
    quoteJob: async (job) => {
      quoted.push(job)
      return { ok: true, value: { pay: { money: 0, food: 12, power: 0, material: 12 } } }
    },
  })

  const form = openJobForm(2)
  enterTeam(form, { 'Trabajadores a enviar': '2', 'Horas de trabajo': '2' })
  await passSeconds(0)

  expect(quoted.at(-1)).toEqual({
    site: { area: 1, site: 2 },
    team: { worker: 2, truck: 0 },
    hours: 2,
  })
  expect(within(form).getByText('Este trabajo paga 12 de comida y 12 de material')).toBeDefined()
})

it('asks no pay for a team with nobody in it', async () => {
  const quoted: Array<SendJob> = []
  await showMap('/map', teamAtHome, {
    quoteJob: async (job) => {
      quoted.push(job)
      return { ok: true, value: { pay: { money: 0, food: 12, power: 0, material: 12 } } }
    },
  })

  const form = openJobForm(2)
  await passSeconds(0)

  expect(quoted).toEqual([])
  expect(within(form).queryByText(/Este trabajo paga/)).toBeNull()
})

it('drops the pay of a team the player has since changed', async () => {
  await showMap('/map', teamAtHome, {
    quoteJob: async (job) => ({
      ok: true,
      value: { pay: { money: 0, food: job.team.worker, power: 0, material: 0 } },
    }),
  })

  const form = openJobForm(2)
  enterTeam(form, { 'Trabajadores a enviar': '2' })
  await passSeconds(0)
  enterTeam(form, { 'Trabajadores a enviar': '3' })

  expect(within(form).queryByText('Este trabajo paga 2 de comida')).toBeNull()
  await passSeconds(0)
  expect(within(form).getByText('Este trabajo paga 3 de comida')).toBeDefined()
})

it('keeps the pay of the last team when an earlier quote answers after it', async () => {
  const answers: Array<() => void> = []
  await showMap('/map', teamAtHome, {
    quoteJob: (job) =>
      new Promise((resolve) => {
        answers.push(() =>
          resolve({
            ok: true,
            value: { pay: { money: 0, food: job.team.worker, power: 0, material: 0 } },
          }),
        )
      }),
  })

  const form = openJobForm(2)
  enterTeam(form, { 'Trabajadores a enviar': '2' })
  await passSeconds(0)
  enterTeam(form, { 'Trabajadores a enviar': '3' })
  await passSeconds(0)
  answers[1]?.()
  await passSeconds(0)
  answers[0]?.()
  await passSeconds(0)

  expect(within(form).getByText('Este trabajo paga 3 de comida')).toBeDefined()
})

it('asks the pay again when the season turns', async () => {
  const inSeason = (kind: 'spring' | 'summer', endsInSeconds: number): TownOverview => ({
    ...teamAtHome,
    season: { kind, year: 1, endsAt: instantAfter(endsInSeconds) },
  })
  const reads = [inSeason('spring', 30), inSeason('summer', 3600)]
  const quotedSeasons: Array<number> = []
  await showMap('/map', reads[0] ?? teamAtHome, {
    town: async () => ({ ok: true, value: reads.shift() ?? inSeason('summer', 3600) }),
    quoteJob: async () => {
      quotedSeasons.push(reads.length)
      return { ok: true, value: { pay: { money: 0, food: 1, power: 0, material: 0 } } }
    },
  })

  const form = openJobForm(2)
  enterTeam(form, { 'Trabajadores a enviar': '2' })
  await passSeconds(0)
  const askedBeforeTurn = quotedSeasons.length
  await passSeconds(31)

  expect(quotedSeasons.length).toBeGreaterThan(askedBeforeTurn)
})

it('blocks a team with nobody in it', async () => {
  await showMap('/map', teamAtHome)

  const send = sendButton(openJobForm(2))

  expect(send.getAttribute('aria-disabled')).toBe('true')
  expect(accessibleDescriptionOf(send)).toBe(refusalInvalidTeam())
})

it('sends a team larger than the one at home and reads the refusal under the form', async () => {
  const sent: Array<SendJob> = []
  await showMap('/map', teamAtHome, {
    sendJob: async (job) => {
      sent.push(job)
      return {
        ok: false,
        refusal: 'NotEnoughHiresAtHome',
        error: { kind: 'NotEnoughHiresAtHome', params: { hire: 'truck', count: 2, atHome: 1 } },
      }
    },
  })

  const form = openJobForm(2)
  enterTeam(form, { 'Camiones a enviar': '2' })
  fireEvent.click(sendButton(form))
  await passSeconds(0)

  expect(sent).toEqual([{ site: { area: 1, site: 2 }, team: { worker: 0, truck: 2 }, hours: 1 }])
  expect(within(form).getByRole('alert').textContent).toBe(
    refusalNotEnoughHiresAtHome({ hire: 'truck', count: 2, atHome: 1 }),
  )
})

it('blocks hours that are not a whole count from 1', async () => {
  await showMap('/map', teamAtHome)

  const form = openJobForm(2)
  enterTeam(form, { 'Trabajadores a enviar': '1', 'Horas de trabajo': '0' })

  expect(accessibleDescriptionOf(sendButton(form))).toBe('Trabaja 1 hora o más.')
})

it('blocks a team count that is not a whole count', async () => {
  await showMap('/map', teamAtHome)

  const form = openJobForm(2)
  enterTeam(form, { 'Trabajadores a enviar': '1.5' })

  expect(accessibleDescriptionOf(sendButton(form))).toBe('Envía un número entero: 0, 1, 2 o más.')
})

it('asks the pay of a second job while a team is out and marks the send with the refusal', async () => {
  const quoted: Array<SendJob> = []
  await showMap('/map', jobIn('working', teamAtHome), {
    quoteJob: async (job) => {
      quoted.push(job)
      return { ok: false, refusal: 'TeamAlreadyOut', error: { kind: 'TeamAlreadyOut' } }
    },
  })

  const form = openJobForm(2)
  enterTeam(form, { 'Trabajadores a enviar': '1' })
  await passSeconds(0)

  expect(quoted).toEqual([{ site: { area: 1, site: 2 }, team: { worker: 1, truck: 0 }, hours: 1 }])
  expect(reasonOf(sendButton(form))?.getAttribute('aria-live')).toBe('polite')
  expect(accessibleDescriptionOf(sendButton(form))).toBe(refusalTeamAlreadyOut())
})

it('sends a job its refused quote marks, since the api decides', async () => {
  const sent: Array<SendJob> = []
  await showMap('/map', jobIn('working', teamAtHome), {
    quoteJob: async () => ({
      ok: false,
      refusal: 'TeamAlreadyOut',
      error: { kind: 'TeamAlreadyOut' },
    }),
    sendJob: async (job) => {
      sent.push(job)
      return { ok: false, refusal: 'TeamAlreadyOut', error: { kind: 'TeamAlreadyOut' } }
    },
  })

  const form = openJobForm(2)
  enterTeam(form, { 'Trabajadores a enviar': '1' })
  await passSeconds(0)
  fireEvent.click(sendButton(form))
  await passSeconds(0)

  expect(sent).toEqual([{ site: { area: 1, site: 2 }, team: { worker: 1, truck: 0 }, hours: 1 }])
})

it('reads one refusal when the send is refused as its quote was', async () => {
  const refusal = {
    ok: false,
    refusal: 'NotEnoughHiresAtHome',
    error: { kind: 'NotEnoughHiresAtHome', params: { hire: 'worker', count: 5, atHome: 3 } },
  } as const
  await showMap('/map', teamAtHome, {
    quoteJob: async () => refusal,
    sendJob: async () => refusal,
  })

  const form = openJobForm(2)
  enterTeam(form, { 'Trabajadores a enviar': '5' })
  await passSeconds(0)
  fireEvent.click(sendButton(form))
  await passSeconds(0)

  expect(
    within(form)
      .getAllByRole('alert')
      .map((alert) => alert.textContent),
  ).toEqual([refusalNotEnoughHiresAtHome({ hire: 'worker', count: 5, atHome: 3 })])
})

it('marks the send with the refusal of the new team once the player changes a refused one', async () => {
  const shortOf = (job: SendJob) =>
    ({
      ok: false,
      refusal: 'NotEnoughHiresAtHome',
      error: {
        kind: 'NotEnoughHiresAtHome',
        params: { hire: 'worker', count: job.team.worker, atHome: 3 },
      },
    }) as const
  await showMap('/map', teamAtHome, {
    quoteJob: async (job) => shortOf(job),
    sendJob: async (job) => shortOf(job),
  })

  const form = openJobForm(2)
  enterTeam(form, { 'Trabajadores a enviar': '5' })
  await passSeconds(0)
  fireEvent.click(sendButton(form))
  await passSeconds(0)
  enterTeam(form, { 'Trabajadores a enviar': '4' })
  await passSeconds(0)

  expect(within(form).queryByRole('alert')).toBeNull()
  expect(accessibleDescriptionOf(sendButton(form))).toBe(
    refusalNotEnoughHiresAtHome({ hire: 'worker', count: 4, atHome: 3 }),
  )
})

it('stops asking the pay again once the player changes the team', async () => {
  const quoted: Array<number> = []
  await showMap('/map', teamAtHome, {
    quoteJob: async (job) => {
      quoted.push(job.team.worker)
      return job.team.worker === 2
        ? { ok: false, refusal: 'Unexpected' }
        : { ok: true, value: { pay: { money: 0, food: 1, power: 0, material: 0 } } }
    },
  })

  const form = openJobForm(2)
  enterTeam(form, { 'Trabajadores a enviar': '2' })
  await passSeconds(0)
  enterTeam(form, { 'Trabajadores a enviar': '1' })
  await passSeconds(10)

  expect(quoted).toEqual([2, 1])
})

it('stops asking the pay again once the form closes', async () => {
  const quoted: Array<SendJob> = []
  await showMap('/map', teamAtHome, {
    quoteJob: async (job) => {
      quoted.push(job)
      return { ok: false, refusal: 'Unexpected' }
    },
  })

  const form = openJobForm(2)
  enterTeam(form, { 'Trabajadores a enviar': '2' })
  await passSeconds(0)
  fireEvent.click(screen.getByRole('button', { name: 'Enviar un equipo al sitio 2' }))
  await passSeconds(10)

  expect(screen.queryByRole('region', { name: 'Trabajo en el sitio 2' })).toBeNull()
  expect(quoted).toHaveLength(1)
})

it('asks the pay again a moment after the server could not be reached', async () => {
  const answers: Array<Awaited<ReturnType<ApiClient['quoteJob']>>> = [
    { ok: false, refusal: 'Unexpected' },
    { ok: true, value: { pay: { money: 0, food: 12, power: 0, material: 0 } } },
  ]
  await showMap('/map', teamAtHome, {
    quoteJob: async () => answers.shift() ?? { ok: false, refusal: 'Unexpected' },
  })

  const form = openJobForm(2)
  enterTeam(form, { 'Trabajadores a enviar': '2' })
  await passSeconds(0)

  expect(within(form).getByRole('alert').textContent).toBe(refusalUnexpected())
  await passSeconds(5)
  expect(within(form).getByText('Este trabajo paga 12 de comida')).toBeDefined()
  expect(within(form).queryByRole('alert')).toBeNull()
})

it('counts the team at home under each field', async () => {
  await showMap('/map', teamAtHome)

  const form = openJobForm(2)

  expect(within(form).getByText('3 en casa')).toBeDefined()
  expect(within(form).getByText('1 en casa')).toBeDefined()
})

it('reads a refused job under the form', async () => {
  await showMap('/map', teamAtHome, {
    sendJob: async () => ({
      ok: false,
      refusal: 'JobHoursOutOfRange',
      error: { kind: 'JobHoursOutOfRange', params: { hours: 30, maxHours: 24 } },
    }),
  })

  const form = openJobForm(2)
  enterTeam(form, { 'Trabajadores a enviar': '1', 'Horas de trabajo': '30' })
  fireEvent.click(sendButton(form))
  await passSeconds(0)

  expect(within(form).getByRole('alert').textContent).toBe('Un trabajo dura de 1 a 24 horas.')
})

it('shows a job on the way with its countdown to the arrival', async () => {
  await showMap('/map', jobIn('outbound'))

  expect(within(jobOut()).getByText('Región 1, zona 1, sitio 2')).toBeDefined()
  expect(within(jobOut()).getByText('Tu equipo: 2 trabajadores, 0 camiones')).toBeDefined()
  expect(within(jobOut()).getByRole('timer').textContent).toBe('En camino0:30')
})

it('shows a job working with its countdown to the leaving', async () => {
  await showMap('/map', jobIn('working'))

  expect(within(jobOut()).getByRole('timer').textContent).toBe('Trabajando55 min')
  expect(within(jobOut()).getByRole('button', { name: 'Llamar de vuelta al equipo' })).toBeDefined()
})

it('shows a job coming back with its countdown to the return and no call back', async () => {
  await showMap('/map', jobIn('returning'))

  expect(within(jobOut()).getByRole('timer').textContent).toBe('Volviendo14 min')
  expect(within(jobOut()).queryByRole('button')).toBeNull()
})

it('shows a called-back job coming back as called back', async () => {
  const returning = jobIn('returning')
  const calledBack: TownOverview = {
    ...returning,
    job: returning.job === null ? null : { ...returning.job, calledBackAt: instantAfter(-60) },
  }
  await showMap('/map', calledBack)

  expect(within(jobOut()).getByRole('timer').textContent).toBe('Llamado de vuelta, volviendo14 min')
})

it('shows the pay as the server answered it', async () => {
  await showMap('/map', jobIn('outbound'))

  expect(within(jobOut()).getByText('Pago: 40 de comida y 20 de material')).toBeDefined()
})

it("reads the town again when the job's team arrives", async () => {
  const reads = [jobIn('outbound'), jobIn('working')]
  await showMap('/map', jobIn('outbound'), {
    town: async () => ({ ok: true, value: reads.shift() ?? jobIn('working') }),
  })

  await passSeconds(29)
  expect(within(jobOut()).getByRole('timer').textContent).toContain('En camino')

  await passSeconds(1)

  expect(within(jobOut()).getByRole('timer').textContent).toContain('Trabajando')
})

it('calls a job back once on a double click', async () => {
  const calledBack: Array<string> = []
  await showMap('/map', jobIn('working'), {
    callJobBack: ({ sentAt }) => {
      calledBack.push(sentAt)
      return new Promise(() => undefined)
    },
  })

  const callBack = within(jobOut()).getByRole('button', { name: 'Llamar de vuelta al equipo' })
  act(() => {
    fireEvent.click(callBack)
    fireEvent.click(callBack)
  })
  await passSeconds(0)

  expect(calledBack).toEqual([instantAfter(-600)])
})

it('adopts the town the call back answers', async () => {
  await showMap('/map', jobIn('working'), {
    callJobBack: async () => ({ ok: true, value: jobIn('returning') }),
  })

  fireEvent.click(within(jobOut()).getByRole('button', { name: 'Llamar de vuelta al equipo' }))
  await passSeconds(0)

  expect(within(jobOut()).getByRole('timer').textContent).toContain('Volviendo')
})

it('reads a refused call back under the job', async () => {
  await showMap('/map', jobIn('working'), {
    callJobBack: async () => ({
      ok: false,
      refusal: 'JobAlreadyReturning',
      error: { kind: 'JobAlreadyReturning' },
    }),
  })

  fireEvent.click(within(jobOut()).getByRole('button', { name: 'Llamar de vuelta al equipo' }))
  await passSeconds(0)

  expect(within(jobOut()).getByRole('alert').textContent).toBe(refusalJobAlreadyReturning())
})
