import type { FiefChronicle } from '@mygame/contracts'
import { screen, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import type { ApiClient } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownFiefPath, knownPlayer, stubApiClient } from '../auth/stubApiClient.testSupport'
import { copy } from '../copy'

const noRefund = { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 }

const signedInClientServing = (chronicle: ApiClient['chronicle']): ApiClient =>
  stubApiClient({ currentPlayer: async () => knownPlayer, chronicle })

const showChronicle = async (chronicle: FiefChronicle): Promise<HTMLElement[]> => {
  renderAppAt(
    `${knownFiefPath}/cronica`,
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
  const [deliveredRow, cancelledRow] = await showChronicle({
    events: [
      {
        kind: 'recruitsDelivered',
        unit: 'infantry',
        count: 1,
        occurredAt: '2026-09-22T11:00:00.000Z',
      },
      {
        kind: 'recruitsCancelled',
        unit: 'infantry',
        delivered: 1,
        cancelled: 1,
        occurredAt: '2026-09-22T10:00:00.000Z',
        refund: { ...noRefund, wood: 20, iron: 10, food: 30 },
      },
    ],
  })

  expect(deliveredRow?.textContent).toContain('Leva terminada: 1 infante.')
  expect(cancelledRow?.textContent).toContain(
    'Leva cancelada: 1 infante en filas, 1 infante de vuelta al campo.',
  )
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

it('shows the units a cancelled order delivered and cancelled', async () => {
  const [row] = await showChronicle({
    events: [
      {
        kind: 'recruitsCancelled',
        unit: 'infantry',
        delivered: 4,
        cancelled: 8,
        occurredAt: '2026-09-22T11:00:00.000Z',
        refund: { ...noRefund, wood: 160, iron: 80, food: 240 },
      },
    ],
  })

  expect(row?.textContent).toContain(
    'Leva cancelada: 4 infantes en filas, 8 infantes de vuelta al campo.',
  )
})

it('shows the refund of a cancelled order', async () => {
  const [row] = await showChronicle({
    events: [
      {
        kind: 'recruitsCancelled',
        unit: 'infantry',
        delivered: 0,
        cancelled: 12,
        occurredAt: '2026-09-22T11:00:00.000Z',
        refund: { ...noRefund, wood: 240, iron: 120, food: 360 },
      },
    ],
  })

  expect(
    within(row as HTMLElement).getByText('Recuperas 240 de madera, 120 de hierro y 360 de comida.'),
  ).toBeDefined()
  expect(row?.textContent).toContain(
    'Leva cancelada: 0 infantes en filas, 12 infantes de vuelta al campo.',
  )
})

it('shows the plot, the infantry and the loot of a returned march', async () => {
  const [row] = await showChronicle({
    events: [
      {
        kind: 'marchReturned',
        province: 2,
        plot: 5,
        units: { infantry: 10, cavalry: 0, settler: 0 },
        loot: { ...noRefund, wood: 200, stone: 200 },
        occurredAt: '2026-09-22T11:00:00.000Z',
        recalled: false,
      },
    ],
  })

  expect(row?.textContent).toContain('Marcha terminada: provincia 2, parcela 5, 10 infantes.')
  expect(
    within(row as HTMLElement).getByText('Recibes 200 de madera y 200 de piedra.'),
  ).toBeDefined()
  expect(within(row as HTMLElement).getByText('Recibes')).toBeDefined()
  expect(within(row as HTMLElement).queryByText(copy.chronicle.recovered)).toBeNull()
})

it('agrees the unit label with one infantry', async () => {
  const [row] = await showChronicle({
    events: [
      {
        kind: 'marchReturned',
        province: 2,
        plot: 7,
        units: { infantry: 1, cavalry: 0, settler: 0 },
        loot: { ...noRefund, wood: 6, stone: 6 },
        occurredAt: '2026-09-22T11:00:00.000Z',
        recalled: false,
      },
    ],
  })

  expect(row?.textContent).toContain('Marcha terminada: provincia 2, parcela 7, 1 infante.')
})

it('leaves out a resource the loot does not hold', async () => {
  const [row] = await showChronicle({
    events: [
      {
        kind: 'marchReturned',
        province: 1,
        plot: 3,
        units: { infantry: 12, cavalry: 0, settler: 0 },
        loot: { ...noRefund, wood: 72, food: 72 },
        occurredAt: '2026-09-22T11:00:00.000Z',
        recalled: false,
      },
    ],
  })

  expect(within(row as HTMLElement).getByText('Recibes 72 de madera y 72 de comida.')).toBeDefined()
  expect(within(row as HTMLElement).queryAllByText('0')).toEqual([])
})

it('leaves out the loot sentence of a march that brought nothing', async () => {
  const [row] = await showChronicle({
    events: [
      {
        kind: 'marchReturned',
        province: 1,
        plot: 3,
        units: { infantry: 12, cavalry: 0, settler: 0 },
        loot: noRefund,
        occurredAt: '2026-09-22T11:00:00.000Z',
        recalled: false,
      },
    ],
  })

  expect(row?.textContent).toContain('Marcha terminada: provincia 1, parcela 3, 12 infantes.')
  expect(within(row as HTMLElement).queryByText(copy.chronicle.received)).toBeNull()
})

it('shows a recalled march with the loot it brought', async () => {
  const [row] = await showChronicle({
    events: [
      {
        kind: 'marchReturned',
        province: 2,
        plot: 7,
        units: { infantry: 12, cavalry: 0, settler: 0 },
        loot: { ...noRefund, wood: 18, stone: 18 },
        occurredAt: '2026-09-22T11:00:00.000Z',
        recalled: true,
      },
    ],
  })

  expect(row?.textContent).toContain('Marcha retirada: provincia 2, parcela 7, 12 infantes.')
  expect(within(row as HTMLElement).getByText('Recibes 18 de madera y 18 de piedra.')).toBeDefined()
  expect(within(row as HTMLElement).getByText('Recibes')).toBeDefined()
  expect(row?.textContent).not.toContain('Marcha terminada')
})

it('shows a march recalled on the way out with no loot', async () => {
  const [row] = await showChronicle({
    events: [
      {
        kind: 'marchReturned',
        province: 2,
        plot: 7,
        units: { infantry: 12, cavalry: 0, settler: 0 },
        loot: noRefund,
        occurredAt: '2026-09-22T11:00:00.000Z',
        recalled: true,
      },
    ],
  })

  expect(row?.textContent).toContain('Marcha retirada: provincia 2, parcela 7, 12 infantes.')
  expect(within(row as HTMLElement).queryByText(copy.chronicle.received)).toBeNull()
})

it('shows an unrecalled march as before', async () => {
  const [row] = await showChronicle({
    events: [
      {
        kind: 'marchReturned',
        province: 2,
        plot: 7,
        units: { infantry: 12, cavalry: 0, settler: 0 },
        loot: { ...noRefund, wood: 72, stone: 72 },
        occurredAt: '2026-09-22T11:00:00.000Z',
        recalled: false,
      },
    ],
  })

  expect(row?.textContent).toContain('Marcha terminada: provincia 2, parcela 7, 12 infantes.')
  expect(within(row as HTMLElement).getByText('Recibes 72 de madera y 72 de piedra.')).toBeDefined()
  expect(row?.textContent).not.toContain('Marcha retirada')
})

it('shows a won battle with the losses on each side', async () => {
  const [row] = await showChronicle({
    events: [
      {
        kind: 'battleFought',
        province: 2,
        plot: 7,
        tier: 1,
        won: true,
        unitsLost: { infantry: 3, cavalry: 0, settler: 0 },
        campLost: 6,
        occurredAt: '2026-09-22T11:00:00.000Z',
      },
    ],
  })

  expect(row?.textContent).toContain(
    'Batalla ganada: provincia 2, parcela 7, campamento de nivel 1. Pierdes 3 infantes y los bandidos pierden 6 de fuerza.',
  )
  expect(within(row as HTMLElement).queryByText(copy.chronicle.received)).toBeNull()
})

it('shows a lost battle', async () => {
  const [row] = await showChronicle({
    events: [
      {
        kind: 'battleFought',
        province: 2,
        plot: 7,
        tier: 2,
        won: false,
        unitsLost: { infantry: 12, cavalry: 0, settler: 0 },
        campLost: 10,
        occurredAt: '2026-09-22T11:00:00.000Z',
      },
    ],
  })

  expect(row?.textContent).toContain(
    'Batalla perdida: provincia 2, parcela 7, campamento de nivel 2. Pierdes 12 infantes y los bandidos pierden 10 de fuerza.',
  )
  expect(row?.textContent).not.toContain('Batalla ganada')
})

it('agrees the unit label with one infantry lost', async () => {
  const [row] = await showChronicle({
    events: [
      {
        kind: 'battleFought',
        province: 2,
        plot: 7,
        tier: 3,
        won: true,
        unitsLost: { infantry: 1, cavalry: 0, settler: 0 },
        campLost: 40,
        occurredAt: '2026-09-22T11:00:00.000Z',
      },
    ],
  })

  expect(row?.textContent).toContain('Pierdes 1 infante y los bandidos pierden 40 de fuerza.')
})

it('names infantry and riders in a return line', async () => {
  const [row] = await showChronicle({
    events: [
      {
        kind: 'marchReturned',
        province: 2,
        plot: 7,
        units: { infantry: 12, cavalry: 6, settler: 0 },
        loot: { ...noRefund, wood: 108, stone: 108 },
        occurredAt: '2026-09-22T11:00:00.000Z',
        recalled: false,
      },
    ],
  })

  expect(row?.textContent).toContain(
    'Marcha terminada: provincia 2, parcela 7, 12 infantes y 6 jinetes.',
  )
})

it('leaves out the infantry of a return of riders alone', async () => {
  const [row] = await showChronicle({
    events: [
      {
        kind: 'marchReturned',
        province: 2,
        plot: 7,
        units: { infantry: 0, cavalry: 1, settler: 0 },
        loot: { ...noRefund, wood: 40, stone: 40, gold: 40 },
        occurredAt: '2026-09-22T11:00:00.000Z',
        recalled: false,
      },
    ],
  })

  expect(row?.textContent).toContain('Marcha terminada: provincia 2, parcela 7, 1 jinete.')
})

it('names the riders lost in a battle line', async () => {
  const [row] = await showChronicle({
    events: [
      {
        kind: 'battleFought',
        province: 2,
        plot: 7,
        tier: 2,
        won: false,
        unitsLost: { infantry: 0, cavalry: 7, settler: 0 },
        campLost: 14,
        occurredAt: '2026-09-22T11:00:00.000Z',
      },
    ],
  })

  expect(row?.textContent).toContain(
    'Batalla perdida: provincia 2, parcela 7, campamento de nivel 2. Pierdes 7 jinetes y los bandidos pierden 14 de fuerza.',
  )
})

it('sets a comma before the second y when both kinds fall', async () => {
  const [row] = await showChronicle({
    events: [
      {
        kind: 'battleFought',
        province: 2,
        plot: 7,
        tier: 1,
        won: true,
        unitsLost: { infantry: 2, cavalry: 2, settler: 0 },
        campLost: 6,
        occurredAt: '2026-09-22T11:00:00.000Z',
      },
    ],
  })

  expect(row?.textContent).toContain(
    'Pierdes 2 infantes y 2 jinetes, y los bandidos pierden 6 de fuerza.',
  )
})

it('reads a battle that lost no one with the infantry at 0', async () => {
  const [row] = await showChronicle({
    events: [
      {
        kind: 'battleFought',
        province: 2,
        plot: 7,
        tier: 1,
        won: true,
        unitsLost: { infantry: 0, cavalry: 0, settler: 0 },
        campLost: 1,
        occurredAt: '2026-09-22T11:00:00.000Z',
      },
    ],
  })

  expect(row?.textContent).toContain('Pierdes 0 infantes y los bandidos pierden 1 de fuerza.')
})

it('reads an infantry-only line as before', async () => {
  const [returned, battle] = await showChronicle({
    events: [
      {
        kind: 'marchReturned',
        province: 2,
        plot: 7,
        units: { infantry: 9, cavalry: 0, settler: 0 },
        loot: { ...noRefund, wood: 120, stone: 120, gold: 120 },
        occurredAt: '2026-09-22T11:00:00.000Z',
        recalled: false,
      },
      {
        kind: 'battleFought',
        province: 2,
        plot: 7,
        tier: 1,
        won: true,
        unitsLost: { infantry: 3, cavalry: 0, settler: 0 },
        campLost: 6,
        occurredAt: '2026-09-22T10:45:00.000Z',
      },
    ],
  })

  expect(returned?.textContent).toContain('Marcha terminada: provincia 2, parcela 7, 9 infantes.')
  expect(battle?.textContent).toContain(
    'Batalla ganada: provincia 2, parcela 7, campamento de nivel 1. Pierdes 3 infantes y los bandidos pierden 6 de fuerza.',
  )
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
    `${knownFiefPath}/cronica`,
    signedInClientServing(async () => ({ ok: true, value: { events: [] } })),
  )

  expect(await screen.findByText(copy.chronicle.empty)).toBeDefined()
})

it('shows the Spanish refusal when the chronicle cannot be read', async () => {
  renderAppAt(
    `${knownFiefPath}/cronica`,
    signedInClientServing(async () => ({ ok: false, refusal: 'Unexpected' })),
  )

  expect((await screen.findByRole('alert')).textContent).toBe(copy.refusals.Unexpected)
})

it('shows the loading line while the chronicle is being read', async () => {
  renderAppAt(
    `${knownFiefPath}/cronica`,
    signedInClientServing(() => new Promise(() => undefined)),
  )

  expect(await screen.findByText(copy.chronicle.loading)).toBeDefined()
})

it('reads the chronicle once when the screen opens', async () => {
  let reads = 0
  renderAppAt(
    `${knownFiefPath}/cronica`,
    signedInClientServing(async () => {
      reads += 1
      return { ok: true, value: { events: [] } }
    }),
  )

  await screen.findByText(copy.chronicle.empty)

  expect(reads).toBe(1)
})
