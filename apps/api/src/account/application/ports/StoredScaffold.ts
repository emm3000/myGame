import type { Scaffold } from '@mygame/domain'

export type StoredScaffold = {
  readonly scaffold: Scaffold
  readonly scaffoldVersion: number
}
