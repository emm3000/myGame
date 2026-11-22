import type { PlayerId, TownChange } from '@mygame/domain'
import { changeTown, type MutateTownDependencies } from '@mygame/domain'
import type { Context } from 'hono'
import { type RespondTownReadingDependencies, respondTownReading } from './respondTownReading'

export type RespondTownChangeDependencies = MutateTownDependencies & RespondTownReadingDependencies

export const respondTownChange = async (
  c: Context,
  playerId: PlayerId,
  change: TownChange,
  dependencies: RespondTownChangeDependencies,
): Promise<Response> =>
  respondTownReading(c, await changeTown(playerId, change, dependencies), dependencies)
