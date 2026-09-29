import type { FiefChronicle } from '@mygame/contracts'
import { screen, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import type { ApiClient } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownPlayer, stubApiClient } from '../auth/stubApiClient.testSupport'
import { copy } from '../copy'

const noRefund = { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 }

const signedInClientServing = (chronicle: ApiClient['chronicle']): ApiClient =>
  stubApiClient({ currentPlayer: async () => knownPlayer, chronicle })

const showChronicle = async (chronicle: FiefChronicle): Promise<HTMLElement[]> => {
  renderAppAt(
    '/cronica',
    signedInClientServing(async () => ({ ok: true, value: chronicle })),
  )
  const list = await screen.findByRole('list', { name: copy.chronicle.title })
  return within(list).getAllByRole('listitem')
}

it('lists the chronicle in the order the api answered', async () => {
  const rows = await showChronicle({
    events: [
      {
        kind: 'upgradeFinished',
        building: 'quarry',
        level: 2,
        occurredAt: '2026-09-22T11:00:00.000Z',
      },
      {
        kind: 'upgradeFinished',
        building: 'sawmill',
        level: 3,
        occurredAt: '2026-09-22T12:00:00.000Z',
      },
    ],
  })

  expect(rows.map((row) => row.textContent)).toEqual([
    expect.stringContaining('Obra terminada: cantera, nivel 2.'),
    expect.stringContaining('Obra terminada: aserradero, nivel 3.'),
  ])
})

it('names the building and the level an upgrade reached', async () => {
  const [row] = await showChronicle({
    events: [
      {
        kind: 'upgradeFinished',
        building: 'ironMine',
        level: 4,
        occurredAt: '2026-09-22T11:00:00.000Z',
      },
    ],
  })

  expect(row?.textContent).toContain('Obra terminada: mina de hierro, nivel 4.')
})

it('names the art and the level a study reached', async () => {
  const [row] = await showChronicle({
    events: [
      { kind: 'artLearned', art: 'smithing', level: 2, occurredAt: '2026-09-22T11:00:00.000Z' },
    ],
  })

  expect(row?.textContent).toContain('Estudio terminado: herrería, nivel 2.')
})

it('lists the resources a cancel refunded', async () => {
  const [upgradeRow, studyRow] = await showChronicle({
    events: [
      {
        kind: 'upgradeCancelled',
        building: 'sawmill',
        level: 3,
        occurredAt: '2026-09-22T11:00:00.000Z',
        refund: { ...noRefund, wood: 120, stone: 80 },
      },
      {
        kind: 'studyCancelled',
        art: 'smithing',
        level: 2,
        occurredAt: '2026-09-22T10:00:00.000Z',
        refund: { ...noRefund, iron: 60, gold: 1200 },
      },
    ],
  })

  expect(
    within(upgradeRow as HTMLElement).getByText('Recuperas 120 de madera y 80 de piedra.'),
  ).toBeDefined()
  expect(within(upgradeRow as HTMLElement).getByText('Recuperas')).toBeDefined()
  expect(within(upgradeRow as HTMLElement).getByText('120')).toBeDefined()
  expect(within(upgradeRow as HTMLElement).getByText('80')).toBeDefined()
  expect(
    within(studyRow as HTMLElement).getByText('Recuperas 60 de hierro y 1 200 de oro.'),
  ).toBeDefined()
})

it('shows the units an order delivered with their count', async () => {
  const [row] = await showChronicle({
    events: [
      {
        kind: 'recruitsDelivered',
        unit: 'infantry',
        count: 12,
        occurredAt: '2026-09-22T11:00:00.000Z',
      },
    ],
  })

  expect(row?.textContent).toContain('Leva terminada: 12 infantes.')
})

it('agrees the unit label with a count of one', async () => {
  const [row] = await showChronicle({
    events: [
      {
        kind: 'recruitsDelivered',
        unit: 'infantry',
        count: 1,
        occurredAt: '2026-09-22T11:00:00.000Z',
      },
    ],
  })

  expect(row?.textContent).toContain('Leva terminada: 1 infante.')
})

it('shows no refund on a recruits-delivered line', async () => {
  const [row] = await showChronicle({
    events: [
      {
        kind: 'recruitsDelivered',
        unit: 'infantry',
        count: 12,
        occurredAt: '2026-09-22T11:00:00.000Z',
      },
    ],
  })

  expect(within(row as HTMLElement).queryByText(copy.chronicle.recovered)).toBeNull()
})

it('shows each event at the instant it happened', async () => {
  const occurredAt = new Date(2025, 8, 12, 9, 15).toISOString()
  const [row] = await showChronicle({
    events: [{ kind: 'artLearned', art: 'masonry', level: 1, occurredAt }],
  })

  const instant = within(row as HTMLElement).getByText('12 sept 2025, 09:15')
  expect(instant.getAttribute('datetime')).toBe(occurredAt)
})

it('shows the empty chronicle of a new fief', async () => {
  renderAppAt(
    '/cronica',
    signedInClientServing(async () => ({ ok: true, value: { events: [] } })),
  )

  expect(await screen.findByText(copy.chronicle.empty)).toBeDefined()
})

it('shows the Spanish refusal when the chronicle cannot be read', async () => {
  renderAppAt(
    '/cronica',
    signedInClientServing(async () => ({ ok: false, refusal: 'Unexpected' })),
  )

  expect((await screen.findByRole('alert')).textContent).toBe(copy.refusals.Unexpected)
})

it('shows the loading line while the chronicle is being read', async () => {
  renderAppAt(
    '/cronica',
    signedInClientServing(() => new Promise(() => undefined)),
  )

  expect(await screen.findByText(copy.chronicle.loading)).toBeDefined()
})

it('reads the chronicle once when the screen opens', async () => {
  let reads = 0
  renderAppAt(
    '/cronica',
    signedInClientServing(async () => {
      reads += 1
      return { ok: true, value: { events: [] } }
    }),
  )

  await screen.findByText(copy.chronicle.empty)

  expect(reads).toBe(1)
})
