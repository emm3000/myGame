import { type Clock, type FiefId, foundFief, type PlayerId } from '@mygame/domain'
import type { ComposedServer } from '../composeServer'

type FoundingServer = Pick<ComposedServer, 'inTransaction' | 'buildingCatalog' | 'ids'>

export const foundFiefFor = async (
  playerId: PlayerId,
  name: string,
  { server, clock }: { readonly server: FoundingServer; readonly clock: Clock },
): Promise<FiefId> => {
  const founded = await server.inTransaction(({ fiefs }) =>
    foundFief(
      { playerId, name },
      { fiefs, catalog: server.buildingCatalog, clock, ids: server.ids },
    ),
  )
  if (!founded.ok) {
    throw new Error(`Founding ${name} failed with ${founded.error.kind}`)
  }
  return founded.value.id
}
