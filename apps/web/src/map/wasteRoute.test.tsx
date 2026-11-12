import { mapCleanUpShort, refusalNoWasteYet, refusalTeamAlreadyOut } from '@mygame/catalog'
import type { CleanUpQuote, RegionMap, SendCleanUp, TownOverview } from '@mygame/contracts'
import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import wasteOne from '../../public/art/waste/waste-1.svg?raw'
import wasteTwo from '../../public/art/waste/waste-2.svg?raw'
import wasteThree from '../../public/art/waste/waste-3.svg?raw'
import type { ApiClient } from '../api/apiClient'
import { artTagsOf } from '../art/artTagsOf'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import {
  knownAreaMap,
  knownPlayer,
  knownTown,
  stubApiClient,
} from '../auth/stubApiClient.testSupport'
import { accessibleDescriptionOf } from '../design-system/accessibleDescriptionOf.testSupport'
import type { WasteSize } from '../design-system/WasteSize'

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

const wasteMap: RegionMap = {
  ...knownAreaMap,
  sites: [
    ...knownAreaMap.sites,
    { site: 4, town: null, waste: { size: 1, waste: 5 } },
    { site: 5, town: null, waste: { size: 2, waste: 12 } },
    { site: 6, town: null, waste: { size: 3, waste: 30 } },
  ],
}

const teamAtHome: TownOverview = {
  ...knownTown,
  hiring: { ...knownTown.hiring, hires: { worker: 6, truck: 2 } },
}

const noPay = { money: 0, food: 0, power: 0, material: 0 }

const quoteOf = (strength: number, waste: number, covers: boolean, pay = noPay): CleanUpQuote => ({
  strength,
  waste,
  pay,
  covers,
})

const showMap = async (town: TownOverview, overrides: Partial<ApiClient> = {}): Promise<void> => {
  renderAppAt(
    '/map',
    stubApiClient({
      currentPlayer: async () => knownPlayer,
      town: async () => ({ ok: true, value: town }),
      regionMap: async () => ({ ok: true, value: wasteMap }),
      ...overrides,
    }),
  )
  await passSeconds(0)
}

const siteRow = (site: number): HTMLElement =>
  screen.getByRole('listitem', { name: `Sitio ${site}` })

const openCleanUpForm = (site: number): HTMLElement => {
  fireEvent.click(screen.getByRole('button', { name: `Limpiar los residuos del sitio ${site}` }))
  return screen.getByRole('region', { name: `Limpieza en el sitio ${site}` })
}

const enterTeam = (form: HTMLElement, entries: Partial<Record<string, string>>): void => {
  for (const [label, value] of Object.entries(entries)) {
    fireEvent.change(within(form).getByLabelText(label), { target: { value } })
  }
}

const sendButton = (form: HTMLElement): HTMLElement =>
  within(form).getByRole('button', { name: 'Enviar el equipo' })

const wasteFiles: Readonly<Record<WasteSize, string>> = { 1: wasteOne, 2: wasteTwo, 3: wasteThree }

const geometryOf = (svg: string): ReadonlyArray<string> =>
  artTagsOf(svg)
    .slice(1)
    .map(({ name, attributes }) => {
      const { fill: _fill, ...geometry } = attributes
      return `${name} ${JSON.stringify(geometry)}`
    })

const drawnOf = (
  row: HTMLElement,
): { geometry: ReadonlyArray<string>; fills: Set<string | undefined> } => {
  const shapes = [...(row.querySelector('svg')?.children ?? [])]
  const tags = shapes.map((shape) => ({
    name: shape.tagName,
    attributes: Object.fromEntries([...shape.attributes].map(({ name, value }) => [name, value])),
  }))
  return {
    geometry: tags.map(({ name, attributes }) => {
      const { fill: _fill, ...geometry } = attributes
      return `${name} ${JSON.stringify(geometry)}`
    }),
    fills: new Set(tags.map(({ attributes }) => attributes.fill)),
  }
}

it('draws each waste site with its silhouette and its waste', async () => {
  await showMap(teamAtHome)

  for (const [site, size, waste] of [
    [4, 1, 5],
    [5, 2, 12],
    [6, 3, 30],
  ] as const) {
    const row = siteRow(site)
    expect(within(row).getByText(`Sitio con residuos, tamaño ${size}`)).toBeDefined()
    expect(within(row).getByText(`Residuos: ${waste}`)).toBeDefined()
    expect(drawnOf(row)).toEqual({
      geometry: geometryOf(wasteFiles[size]),
      fills: new Set(['var(--ink-muted)']),
    })
  }
})

it('offers a clean-up on a waste site and no job', async () => {
  await showMap(teamAtHome)

  const row = siteRow(4)
  expect(
    within(row)
      .getAllByRole('button')
      .map((button) => button.textContent),
  ).toEqual(['Limpiar los residuos'])
})

it("reads the team against the waste from the server's quote", async () => {
  const quoted: Array<SendCleanUp> = []
  await showMap(teamAtHome, {
    quoteCleanUp: async (cleanUp) => {
      quoted.push(cleanUp)
      return { ok: true, value: quoteOf(14, 12, true, { ...noPay, money: 24, material: 12 }) }
    },
  })

  const form = openCleanUpForm(5)
  enterTeam(form, { 'Trabajadores a enviar': '4', 'Camiones a enviar': '1' })
  await passSeconds(0)

  expect(quoted.at(-1)).toEqual({ site: { area: 1, site: 5 }, team: { worker: 4, truck: 1 } })
  expect(within(form).getByText('Residuos: 12')).toBeDefined()
  expect(within(form).getByText('Tu equipo: 14')).toBeDefined()
  expect(within(form).getByText('Este trabajo paga 24 de dinero y 12 de material')).toBeDefined()
  expect(within(form).queryByText(/Tu equipo no puede/)).toBeNull()
})

it('warns when the team cannot cover the waste', async () => {
  await showMap(teamAtHome, {
    quoteCleanUp: async () => ({ ok: true, value: quoteOf(4, 30, false) }),
  })

  const form = openCleanUpForm(6)
  enterTeam(form, { 'Trabajadores a enviar': '2' })
  await passSeconds(0)

  expect(
    within(form).getByText(
      'Tu equipo no puede limpiar todos estos residuos. Envía más trabajadores o camiones.',
    ),
  ).toBeDefined()
  expect(accessibleDescriptionOf(sendButton(form))).toBe('')
})

it('reads whether the team covers the waste from the server, never from its strength', async () => {
  await showMap(teamAtHome, {
    quoteCleanUp: async () => ({ ok: true, value: quoteOf(30, 4, false) }),
  })

  const form = openCleanUpForm(6)
  enterTeam(form, { 'Trabajadores a enviar': '2' })
  await passSeconds(0)

  expect(within(form).getByText(mapCleanUpShort())).toBeDefined()
})

it('still sends a team that cannot cover the waste, as the server decides', async () => {
  const sent: Array<SendCleanUp> = []
  await showMap(teamAtHome, {
    quoteCleanUp: async () => ({ ok: true, value: quoteOf(4, 30, false) }),
    sendCleanUp: async (cleanUp) => {
      sent.push(cleanUp)
      return { ok: true, value: teamAtHome }
    },
  })

  const form = openCleanUpForm(6)
  enterTeam(form, { 'Trabajadores a enviar': '2' })
  await passSeconds(0)
  fireEvent.click(sendButton(form))
  await passSeconds(0)

  expect(sent).toEqual([{ site: { area: 1, site: 6 }, team: { worker: 2, truck: 0 } }])
})

it('asks no quote for a team with nobody in it', async () => {
  const quoted: Array<SendCleanUp> = []
  await showMap(teamAtHome, {
    quoteCleanUp: async (cleanUp) => {
      quoted.push(cleanUp)
      return { ok: true, value: quoteOf(1, 5, false) }
    },
  })

  const form = openCleanUpForm(4)
  await passSeconds(0)

  expect(quoted).toEqual([])
  expect(within(form).queryByText(/Residuos:/)).toBeNull()
  expect(accessibleDescriptionOf(sendButton(form))).toContain('Elige al menos')
})

it('sends a clean-up once on a double click', async () => {
  const sent: Array<SendCleanUp> = []
  await showMap(teamAtHome, {
    sendCleanUp: (cleanUp) => {
      sent.push(cleanUp)
      return new Promise(() => undefined)
    },
  })

  const form = openCleanUpForm(4)
  enterTeam(form, { 'Trabajadores a enviar': '3' })
  const send = sendButton(form)
  act(() => {
    fireEvent.click(send)
    fireEvent.click(send)
  })
  await passSeconds(0)

  expect(sent).toEqual([{ site: { area: 1, site: 4 }, team: { worker: 3, truck: 0 } }])
})

it('reads a refused clean-up under the form', async () => {
  await showMap(teamAtHome, {
    quoteCleanUp: async () => ({ ok: true, value: quoteOf(3, 5, false) }),
    sendCleanUp: async () => ({
      ok: false,
      refusal: 'NoWasteYet',
      error: { kind: 'NoWasteYet' },
    }),
  })

  const form = openCleanUpForm(4)
  enterTeam(form, { 'Trabajadores a enviar': '3' })
  fireEvent.click(sendButton(form))
  await passSeconds(0)

  expect(within(form).getByRole('alert').textContent).toBe(refusalNoWasteYet())
})

it('marks the send with the reason of a refused quote', async () => {
  await showMap(teamAtHome, {
    quoteCleanUp: async () => ({
      ok: false,
      refusal: 'TeamAlreadyOut',
      error: { kind: 'TeamAlreadyOut' },
    }),
  })

  const form = openCleanUpForm(4)
  enterTeam(form, { 'Trabajadores a enviar': '3' })
  await passSeconds(0)

  expect(reasonOf(sendButton(form))?.getAttribute('aria-live')).toBe('polite')
  expect(accessibleDescriptionOf(sendButton(form))).toBe(refusalTeamAlreadyOut())
})

it('sends a clean-up its refused quote marks, since the api decides', async () => {
  const sent: Array<SendCleanUp> = []
  await showMap(teamAtHome, {
    quoteCleanUp: async () => ({
      ok: false,
      refusal: 'TeamAlreadyOut',
      error: { kind: 'TeamAlreadyOut' },
    }),
    sendCleanUp: async (cleanUp) => {
      sent.push(cleanUp)
      return { ok: false, refusal: 'TeamAlreadyOut', error: { kind: 'TeamAlreadyOut' } }
    },
  })

  const form = openCleanUpForm(4)
  enterTeam(form, { 'Trabajadores a enviar': '3' })
  await passSeconds(0)
  fireEvent.click(sendButton(form))
  await passSeconds(0)

  expect(sent).toEqual([{ site: { area: 1, site: 4 }, team: { worker: 3, truck: 0 } }])
})

it('drops a refused clean-up once the player edits the team', async () => {
  await showMap(teamAtHome, {
    quoteCleanUp: async () => ({ ok: true, value: quoteOf(3, 5, false) }),
    sendCleanUp: async () => ({
      ok: false,
      refusal: 'NoWasteYet',
      error: { kind: 'NoWasteYet' },
    }),
  })

  const form = openCleanUpForm(4)
  enterTeam(form, { 'Trabajadores a enviar': '3' })
  fireEvent.click(sendButton(form))
  await passSeconds(0)
  expect(within(form).getByRole('alert').textContent).toBe(refusalNoWasteYet())

  enterTeam(form, { 'Trabajadores a enviar': '4' })
  await passSeconds(0)

  expect(within(form).queryByRole('alert')).toBeNull()
})

const instantAfter = (seconds: number): string => new Date(readAt + seconds * 1000).toISOString()

const cleanUpIn = (phase: 'outbound' | 'returning', pay = noPay): TownOverview => ({
  ...teamAtHome,
  job: {
    kind: 'cleanUp',
    site: { region: 1, area: 1, site: 5 },
    team: { worker: 4, truck: 1 },
    size: 2,
    waste: 12,
    pay,
    phase,
    sentAt: instantAfter(-600),
    arrivesAt: instantAfter(phase === 'outbound' ? 30 : -300),
    leavesAt: instantAfter(phase === 'outbound' ? 30 : -300),
    returnsAt: instantAfter(phase === 'outbound' ? 330 : 840),
    calledBackAt: null,
  },
})

const cleanUpOut = (): HTMLElement => screen.getByRole('region', { name: 'Limpieza de residuos' })

it('shows a clean-up out with its waste and its countdown', async () => {
  await showMap(cleanUpIn('outbound'))

  expect(within(cleanUpOut()).getByText('Región 1, zona 1, sitio 5')).toBeDefined()
  expect(within(cleanUpOut()).getByText('Residuos: 12')).toBeDefined()
  expect(within(cleanUpOut()).getByRole('timer').textContent).toBe('En camino0:30')
})

it('shows a clean-up coming back with the pay the server answered', async () => {
  await showMap(cleanUpIn('returning', { ...noPay, money: 24, material: 12 }))

  expect(within(cleanUpOut()).getByText('Pago: 24 de dinero y 12 de material')).toBeDefined()
})

it('shows a clean-up coming back with no pay line when the server answered none', async () => {
  await showMap(cleanUpIn('returning'))

  expect(within(cleanUpOut()).queryByText(/Pago:/)).toBeNull()
})
