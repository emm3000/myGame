import { players } from '../../town/infrastructure/postgres/townTables'

export const storedScaffoldColumns = {
  scaffold: players.scaffold,
  scaffoldVersion: players.scaffoldVersion,
}
