import type { Player } from '@mygame/contracts'
import type { StoredScaffold } from '@mygame/domain'

export const presentScaffold = ({
  scaffold,
  scaffoldVersion,
}: StoredScaffold): Pick<Player, 'scaffold' | 'scaffoldVersion'> => ({ scaffold, scaffoldVersion })
