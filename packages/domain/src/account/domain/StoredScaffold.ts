import type { Scaffold } from '#learning/scaffold/Scaffold'

export type StoredScaffold = {
  readonly scaffold: Scaffold
  readonly scaffoldVersion: number
}
