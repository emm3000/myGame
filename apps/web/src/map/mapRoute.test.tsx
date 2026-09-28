import type { ProvinceMap } from '@mygame/contracts'
import { fireEvent, screen, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import type { ApiClient } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownPlayer, knownProvinceMap, stubApiClient } from '../auth/stubApiClient.testSupport'
import { copy } from '../copy'

const signedInClientServing = (provinceMap: ApiClient['provinceMap']): ApiClient =>
  stubApiClient({ currentPlayer: async () => knownPlayer, provinceMap })

const recordingClient = (
  answer: (province: number | undefined) => ProvinceMap,
): { readonly client: ApiClient; readonly requested: Array<number | undefined> } => {
  const requested: Array<number | undefined> = []
  const client = signedInClientServing(async (province) => {
    requested.push(province)
    return { ok: true, value: answer(province) }
  })
  return { client, requested }
}

it('opens the province of the fief when no number is named', async () => {
  const { client, requested } = recordingClient(() => knownProvinceMap)

  renderAppAt('/mapa', client)

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
  const plots = await showPlots('/mapa', knownProvinceMap)

  expect(plots).toHaveLength(15)
  plots.forEach((plot, index) => {
    expect(within(plot).getByText(`Parcela ${index + 1}`)).toBeDefined()
    expect(within(plot).getByText('riscos')).toBeDefined()
  })
  expect(screen.getByText('Terreno: riscos')).toBeDefined()
})

it('names the fief that holds a plot', async () => {
  const plots = await showPlots('/mapa', knownProvinceMap)

  expect(within(plots[6] as HTMLElement).getByText('Castrofrio')).toBeDefined()
})

it('marks the fief of the viewer', async () => {
  const plots = await showPlots('/mapa', knownProvinceMap)

  const marked = plots.filter((plot) => plot.getAttribute('aria-current') === 'true')
  expect(marked).toHaveLength(1)
  expect(within(marked[0] as HTMLElement).getByText('Fuenteclara')).toBeDefined()
  expect(within(marked[0] as HTMLElement).getByText('Tu feudo')).toBeDefined()
})

it('shows a free plot with the free line', async () => {
  const plots = await showPlots('/mapa', knownProvinceMap)

  expect(within(plots[1] as HTMLElement).getByText('libre')).toBeDefined()
  expect(within(plots[1] as HTMLElement).queryByText('Tu feudo')).toBeNull()
})

it('names the terrain of the province the api answered', async () => {
  await showPlots('/mapa/1', { ...knownProvinceMap, province: 1, terrain: 'lowlands' })

  expect(screen.getByText('Terreno: vega')).toBeDefined()
})

it('disables previous on the first province', async () => {
  await showPlots('/mapa/1', { ...knownProvinceMap, province: 1 })

  expect((await button('Provincia anterior')).disabled).toBe(true)
  expect((await button('Provincia siguiente')).disabled).toBe(false)
})

it('disables next on the last province of the map', async () => {
  await showPlots('/mapa/4', { ...knownProvinceMap, province: 4, lastProvince: 4 })

  expect((await button('Provincia siguiente')).disabled).toBe(true)
  expect((await button('Provincia anterior')).disabled).toBe(false)
})

it('moves to the previous province', async () => {
  const { client, requested } = recordingClient(provinceNumbered)
  renderAppAt('/mapa', client)

  fireEvent.click(await button('Provincia anterior'))

  expect(
    await screen.findByRole('heading', { level: 3, name: 'Vadoalto, provincia 2' }),
  ).toBeDefined()
  expect(requested).toEqual([undefined, 2])
})

it('moves to the next province', async () => {
  const { client, requested } = recordingClient(provinceNumbered)
  renderAppAt('/mapa/2', client)

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
  renderAppAt('/mapa', client)

  await typeProvince('1')

  expect(
    await screen.findByRole('heading', { level: 3, name: 'Vadoalto, provincia 1' }),
  ).toBeDefined()
  expect(requested).toEqual([undefined, 1])
})

it('sends no request for a typed province beyond the map', async () => {
  const { client, requested } = recordingClient(provinceNumbered)
  renderAppAt('/mapa', client)

  await typeProvince('5')

  expect(screen.getByRole('heading', { level: 3, name: 'Vadoalto, provincia 3' })).toBeDefined()
  expect(requested).toEqual([undefined])
})

it('shows the Spanish refusal for a province beyond the map', async () => {
  renderAppAt(
    '/mapa/9',
    signedInClientServing(async () => ({ ok: false, refusal: 'ProvinceNotFound' })),
  )

  expect((await screen.findByRole('alert')).textContent).toBe(
    'Esa provincia no está en el mapa. Vuelve a la tuya.',
  )
})

it("leads back from a province beyond the map to the viewer's own province", async () => {
  const requested: Array<number | undefined> = []
  renderAppAt(
    '/mapa/9',
    signedInClientServing(async (province) => {
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

it.each(['/mapa/0', '/mapa/abc'])('refuses %s without asking the api', async (path) => {
  const { client, requested } = recordingClient(provinceNumbered)
  renderAppAt(path, client)

  expect((await screen.findByRole('alert')).textContent).toBe(copy.refusals.ProvinceNotFound)
  expect(requested).toEqual([])
})

it('shows the Spanish refusal when the map cannot be read', async () => {
  renderAppAt(
    '/mapa',
    signedInClientServing(async () => ({ ok: false, refusal: 'Unexpected' })),
  )

  expect((await screen.findByRole('alert')).textContent).toBe(copy.refusals.Unexpected)
})

it('shows the loading line while the map is being read', async () => {
  renderAppAt(
    '/mapa',
    signedInClientServing(() => new Promise(() => undefined)),
  )

  expect(await screen.findByText('Estamos leyendo el mapa…')).toBeDefined()
})

it('reads the map once when the screen opens', async () => {
  const { client, requested } = recordingClient(provinceNumbered)
  renderAppAt('/mapa/3', client)

  await screen.findByRole('heading', { level: 3, name: 'Vadoalto, provincia 3' })

  expect(requested).toEqual([3])
})

it('opens the province of the fief from its address', async () => {
  const { client, requested } = recordingClient(provinceNumbered)
  renderAppAt('/', client)

  fireEvent.click(await screen.findByRole('link', { name: 'Vadoalto 3:12' }))

  expect(
    await screen.findByRole('heading', { level: 3, name: 'Vadoalto, provincia 3' }),
  ).toBeDefined()
  expect(requested).toEqual([3])
})
