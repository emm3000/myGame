import type { Scaffold } from '#learning/scaffold/domain/Scaffold'

export type StoredScaffold = {
  readonly scaffold: Scaffold
  readonly scaffoldVersion: number
}
