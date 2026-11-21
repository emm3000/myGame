import { players } from '../../account/infrastructure/postgres/accountTables'

export const storedScaffoldColumns = {
  scaffold: players.scaffold,
  scaffoldVersion: players.scaffoldVersion,
}
