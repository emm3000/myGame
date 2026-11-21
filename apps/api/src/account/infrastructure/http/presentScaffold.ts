import type { Player } from '@mygame/contracts'
import type { StoredScaffold } from '../../application/ports/StoredScaffold'

export const scaffoldBodyOf = ({
  scaffold,
  scaffoldVersion,
}: StoredScaffold): Pick<Player, 'scaffold' | 'scaffoldVersion'> => ({ scaffold, scaffoldVersion })
