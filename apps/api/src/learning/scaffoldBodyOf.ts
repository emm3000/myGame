import type { Scaffold, ScaffoldVersion } from '@mygame/contracts'
import type { StoredScaffold } from '../auth/StoredScaffold'

export type ScaffoldBody = {
  readonly scaffold: Scaffold
  readonly scaffoldVersion: ScaffoldVersion
}

export const scaffoldBodyOf = ({ scaffold, scaffoldVersion }: StoredScaffold): ScaffoldBody => ({
  scaffold,
  scaffoldVersion,
})
