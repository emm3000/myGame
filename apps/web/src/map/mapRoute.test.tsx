import type { ProvinceMap } from '@mygame/contracts'
import { act, fireEvent, screen, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import type { ApiClient } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import {
  knownFiefPath,
  knownPlayer,
  knownProvinceMap,
  stubApiClient,
} from '../auth/stubApiClient.testSupport'
import { copy } from '../copy'

const signedInClientServing = (provinceMap: ApiClient['provinceMap']): ApiClient =>
  stubApiClient({ currentPlayer: async () => knownPlayer, provinceMap })

type RecordingClient = {
  readonly client: ApiClient
  readonly requested: Array<number | undefined>
  readonly fiefIds: Array<string>
}

const recordingClient = (
  answer: (province: number | undefined) => ProvinceMap,
): RecordingClient => {
  const requested: Array<number | undefined> = []
  const fiefIds: Array<string> = []
  const client = signedInClientServing(async (fiefId, province) => {
    requested.push(province)
    fiefIds.push(fiefId)
    const map = answer(province)
    return map.province > map.lastProvince
      ? { ok: false, refusal: 'ProvinceNotFound' }
      : { ok: true, value: map }
  })
  return { client, requested, fiefIds }
}

it('opens the province of the fief when no number is named', async () => {
  const { client, requested } = recordingClient(() => knownProvinceMap)

  renderAppAt(`${knownFiefPath}/mapa`, client)

  expect(
    await screen.findByRole('heading', { level: 3, name: 'Vadoalto, provincia 3' }),
  ).toBeDefined()
  expect(requested).toEqual([undefined])
})

const provinceNumbered = (province: number | undefined): ProvinceMap => ({
  ...knownProvinceMap,
  province: province ?? knownProvinceMap.province,
})

const showPlots = async (path: string, map: ProvinceMap): Promise<HTMLElement[]> => {
  renderAppAt(path, recordingClient(() => map).client)
  const list = await screen.findByRole('list', {
    name: copy.map.heading(map.kingdom, map.province),
  })
  return within(list).getAllByRole('listitem')
}

const button = async (name: string): Promise<HTMLButtonElement> =>
  (await screen.findByRole('button', { name })) as HTMLButtonElement

it('lists every plot the api answered with its terrain', async () => {
  const plots = await showPlots(`${knownFiefPath}/mapa`, knownProvinceMap)

  expect(plots).toHaveLength(15)
  plots.forEach((plot, index) => {
    expect(within(plot).getByText(`Parcela ${index + 1}`)).toBeDefined()
    expect(within(plot).getByText('riscos')).toBeDefined()
  })
  expect(screen.getByText('Terreno: riscos')).toBeDefined()
})

it('names the fief that holds a plot', async () => {
  const plots = await showPlots(`${knownFiefPath}/mapa`, knownProvinceMap)

  expect(within(plots[6] as HTMLElement).getByText('Castrofrio')).toBeDefined()
})

it('marks the fief of the viewer as own', async () => {
  const plots = await showPlots(`${knownFiefPath}/mapa`, knownProvinceMap)

  expect(within(plots[11] as HTMLElement).getByText('Fuenteclara')).toBeDefined()
  expect(within(plots[11] as HTMLElement).getByText('Tu feudo')).toBeDefined()
})

it('marks no own fief as the one the map is read from', async () => {
  const plots = await showPlots(
    `${knownFiefPath}/mapa`,
    plotsWith({ 7: { fief: { name: 'Sotoverde del Páramo', isOwn: true } } }),
  )

  expect(plots.filter((plot) => plot.hasAttribute('aria-current'))).toEqual([])
})

it('shows a free plot with the free line', async () => {
  const plots = await showPlots(`${knownFiefPath}/mapa`, knownProvinceMap)

  expect(within(plots[1] as HTMLElement).getByText('libre')).toBeDefined()
  expect(within(plots[1] as HTMLElement).queryByText('Tu feudo')).toBeNull()
})

it('names the terrain of the province the api answered', async () => {
  await showPlots(`${knownFiefPath}/mapa/1`, {
    ...knownProvinceMap,
    province: 1,
    terrain: 'lowlands',
  })

  expect(screen.getByText('Terreno: vega')).toBeDefined()
})

const pressBlocked = async (name: string): Promise<HTMLButtonElement> => {
  const blocked = await button(name)
  blocked.focus()
  fireEvent.click(blocked)
  await act(async () => undefined)
  return blocked
}

it('blocks previous on the first province and keeps focus on it', async () => {
  const { client, requested } = recordingClient(() => ({ ...knownProvinceMap, province: 1 }))
  renderAppAt(`${knownFiefPath}/mapa/1`, client)

  const previous = await pressBlocked('Provincia anterior')

  expect(previous.getAttribute('aria-disabled')).toBe('true')
  expect(document.activeElement).toBe(previous)
  expect(requested).toEqual([1])
  expect((await button('Provincia siguiente')).hasAttribute('aria-disabled')).toBe(false)
})

it('blocks next on the last province of the map and keeps focus on it', async () => {
  const { client, requested } = recordingClient(() => ({
    ...knownProvinceMap,
    province: 4,
    lastProvince: 4,
  }))
  renderAppAt(`${knownFiefPath}/mapa/4`, client)

  const next = await pressBlocked('Provincia siguiente')

  expect(next.getAttribute('aria-disabled')).toBe('true')
  expect(document.activeElement).toBe(next)
  expect(requested).toEqual([4])
  expect((await button('Provincia anterior')).hasAttribute('aria-disabled')).toBe(false)
})

it('moves to the previous province', async () => {
  const { client, requested } = recordingClient(provinceNumbered)
  renderAppAt(`${knownFiefPath}/mapa`, client)

  fireEvent.click(await button('Provincia anterior'))

  expect(
    await screen.findByRole('heading', { level: 3, name: 'Vadoalto, provincia 2' }),
  ).toBeDefined()
  expect(requested).toEqual([undefined, 2])
})

it('moves to the next province', async () => {
  const { client, requested } = recordingClient(provinceNumbered)
  renderAppAt(`${knownFiefPath}/mapa/2`, client)

  fireEvent.click(await button('Provincia siguiente'))

  expect(
    await screen.findByRole('heading', { level: 3, name: 'Vadoalto, provincia 3' }),
  ).toBeDefined()
  expect(requested).toEqual([2, 3])
})

const typeProvince = async (typed: string): Promise<void> => {
  fireEvent.change(await screen.findByRole('spinbutton', { name: 'Ir a la provincia' }), {
    target: { value: typed },
  })
  fireEvent.click(await button('Ir a la provincia'))
}

it('jumps to the province typed', async () => {
  const { client, requested } = recordingClient(provinceNumbered)
  renderAppAt(`${knownFiefPath}/mapa`, client)

  await typeProvince('1')

  expect(
    await screen.findByRole('heading', { level: 3, name: 'Vadoalto, provincia 1' }),
  ).toBeDefined()
  expect(requested).toEqual([undefined, 1])
})

it('sends no request for a typed province beyond the map', async () => {
  const { client, requested } = recordingClient(provinceNumbered)
  renderAppAt(`${knownFiefPath}/mapa`, client)

  await typeProvince('5')

  expect(screen.getByRole('heading', { level: 3, name: 'Vadoalto, provincia 3' })).toBeDefined()
  expect(requested).toEqual([undefined])
})

it('shows the Spanish refusal for a province beyond the map', async () => {
  renderAppAt(
    `${knownFiefPath}/mapa/9`,
    signedInClientServing(async () => ({ ok: false, refusal: 'ProvinceNotFound' })),
  )

  expect((await screen.findByRole('alert')).textContent).toBe(
    'Esa provincia no está en el mapa. Vuelve a la tuya.',
  )
})

it("leads back from a province beyond the map to the viewer's own province", async () => {
  const requested: Array<number | undefined> = []
  renderAppAt(
    `${knownFiefPath}/mapa/9`,
    signedInClientServing(async (_fiefId, province) => {
      requested.push(province)
      return province === undefined
        ? { ok: true, value: knownProvinceMap }
        : { ok: false, refusal: 'ProvinceNotFound' }
    }),
  )

  fireEvent.click(await screen.findByRole('link', { name: 'Ir a tu provincia' }))

  expect(
    await screen.findByRole('heading', { level: 3, name: 'Vadoalto, provincia 3' }),
  ).toBeDefined()
  expect(requested).toEqual([9, undefined])
})

it.each([`${knownFiefPath}/mapa/0`, `${knownFiefPath}/mapa/abc`])(
  'refuses %s without asking the api',
  async (path) => {
    const { client, requested } = recordingClient(provinceNumbered)
    renderAppAt(path, client)

    expect((await screen.findByRole('alert')).textContent).toBe(copy.refusals.ProvinceNotFound)
    expect(screen.getByRole('link', { name: 'Ir a tu provincia' })).toBeDefined()
    expect(requested).toEqual([])
  },
)

it('shows the Spanish refusal when the map cannot be read', async () => {
  renderAppAt(
    `${knownFiefPath}/mapa`,
    signedInClientServing(async () => ({ ok: false, refusal: 'Unexpected' })),
  )

  expect((await screen.findByRole('alert')).textContent).toBe(copy.refusals.Unexpected)
  expect(screen.queryByRole('link', { name: 'Ir a tu provincia' })).toBeNull()
})

it('shows the loading line while the map is being read', async () => {
  renderAppAt(
    `${knownFiefPath}/mapa`,
    signedInClientServing(() => new Promise(() => undefined)),
  )

  expect(await screen.findByText('Estamos leyendo el mapa…')).toBeDefined()
})

it('reads the map once when the screen opens', async () => {
  const { client, requested } = recordingClient(provinceNumbered)
  renderAppAt(`${knownFiefPath}/mapa/3`, client)

  await screen.findByRole('heading', { level: 3, name: 'Vadoalto, provincia 3' })

  expect(requested).toEqual([3])
})

it('opens the province of the fief from its address', async () => {
  const { client, requested } = recordingClient(provinceNumbered)
  renderAppAt(knownFiefPath, client)

  fireEvent.click(await screen.findByRole('link', { name: 'Vadoalto 3:12' }))

  expect(
    await screen.findByRole('heading', { level: 3, name: 'Vadoalto, provincia 3' }),
  ).toBeDefined()
  expect(requested).toEqual([3])
})

it('asks the api with the fief id from the URL while browsing', async () => {
  const robledalId = '3e8d6f2b-1c4a-4b7e-9d5f-6a0b2c8e4f71'
  const { client, requested, fiefIds } = recordingClient(provinceNumbered)
  renderAppAt(`/feudo/${robledalId}/mapa/9`, client)
  const provinceHeading = (province: number): Promise<HTMLElement> =>
    screen.findByRole('heading', { level: 3, name: `Vadoalto, provincia ${province}` })

  fireEvent.click(await screen.findByRole('link', { name: 'Ir a tu provincia' }))
  await provinceHeading(3)
  fireEvent.click(await button('Provincia siguiente'))
  await provinceHeading(4)
  fireEvent.click(await button('Provincia anterior'))
  await provinceHeading(3)
  await typeProvince('1')
  await provinceHeading(1)

  expect(requested).toEqual([9, undefined, 4, 3, 1])
  expect(fiefIds).toEqual([robledalId, robledalId, robledalId, robledalId, robledalId])
})

const plotsWith = (changed: Partial<Record<number, Partial<ProvinceMap['plots'][number]>>>) => ({
  ...knownProvinceMap,
  plots: knownProvinceMap.plots.map((plot) => ({ ...plot, ...changed[plot.plot] })),
})

const reservedBy = (isOwn: boolean): ProvinceMap => plotsWith({ 5: { reservation: { isOwn } } })

it('reads a plot reserved by another lord', async () => {
  const plots = await showPlots(`${knownFiefPath}/mapa`, reservedBy(false))

  const reserved = plots[4] as HTMLElement
  expect(within(reserved).getByText('reservada')).toBeDefined()
  expect(within(reserved).queryByText('Tu fundación')).toBeNull()
  expect(within(reserved).queryByText('libre')).toBeNull()
})

it('reads a plot the lord reserved', async () => {
  const plots = await showPlots(`${knownFiefPath}/mapa`, reservedBy(true))

  const reserved = plots[4] as HTMLElement
  expect(within(reserved).getByText('reservada')).toBeDefined()
  expect(within(reserved).getByText('Tu fundación')).toBeDefined()
})

it('offers no action on a reserved plot', async () => {
  const plots = await showPlots(`${knownFiefPath}/mapa`, reservedBy(true))

  expect(await screen.findByRole('button', { name: copy.march.sendTo(6) })).toBeDefined()
  expect(within(plots[4] as HTMLElement).queryByRole('button')).toBeNull()
})

it('offers no action on a plot another lord reserved', async () => {
  const plots = await showPlots(`${knownFiefPath}/mapa`, reservedBy(false))

  expect(await screen.findByRole('button', { name: copy.march.sendTo(6) })).toBeDefined()
  expect(within(plots[4] as HTMLElement).queryByRole('button')).toBeNull()
})

it('marks both own fiefs', async () => {
  const plots = await showPlots(
    `${knownFiefPath}/mapa`,
    plotsWith({ 7: { fief: { name: 'Sotoverde del Páramo', isOwn: true } } }),
  )

  expect(within(plots[6] as HTMLElement).getByText('Tu feudo')).toBeDefined()
  expect(within(plots[11] as HTMLElement).getByText('Tu feudo')).toBeDefined()
})
