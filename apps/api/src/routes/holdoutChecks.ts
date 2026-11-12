import { OpenAPIHono } from '@hono/zod-openapi'
import {
  HoldoutCheckAnswersSchema,
  type HoldoutCheckRequest,
  HoldoutCheckRequestSchema,
} from '@mygame/contracts'
import {
  answerHoldoutCheck,
  beginHoldoutCheck,
  type DomainError,
  type HoldoutCheckView,
  type PlayerId,
  type RandomSource,
  type Result,
  readHoldoutChecks,
  skipHoldoutCheck,
} from '@mygame/domain'
import type { Context } from 'hono'
import { answerRefusal } from '../http/answerRefusal'
import { bodyOf } from '../http/bodyOf'
import { honoPathOf } from '../http/honoPath'
import { type RequirePlayerDependencies, requirePlayer } from '../http/requirePlayer'
import { holdoutChecksBodyOf } from '../learning/holdoutChecksBodyOf'
import type { LearningDependencies } from '../learning/LearningDependencies'
import { mutateTown, type TownStores } from '../town/mutateTown'
import { holdoutCheckDeclarations } from './holdoutCheckDeclarations'

export type HoldoutCheckRouteDependencies = LearningDependencies &
  RequirePlayerDependencies & {
    readonly random: RandomSource
  }

type CheckMutation = (
  stores: TownStores,
  check: HoldoutCheckRequest,
  clock: LearningDependencies['clock'],
) => Promise<Result<unknown, DomainError>>

const answerChecks = (
  c: Context,
  views: Result<ReadonlyArray<HoldoutCheckView>, DomainError>,
): Response => (views.ok ? c.json(holdoutChecksBodyOf(views.value)) : answerRefusal(c, views.error))

export const holdoutCheckRoutes = (dependencies: HoldoutCheckRouteDependencies): OpenAPIHono => {
  const signedInPlayer = requirePlayer(dependencies)
  const { lessons, random, inTransaction, clock } = dependencies
  const routes = new OpenAPIHono()
  for (const declaration of Object.values(holdoutCheckDeclarations)) {
    routes.openAPIRegistry.registerPath(declaration)
  }
  const checksAfter = (
    playerId: PlayerId,
    check: HoldoutCheckRequest,
    mutation: CheckMutation,
  ): Promise<Result<ReadonlyArray<HoldoutCheckView>, DomainError>> =>
    mutateTown(
      playerId,
      async (stores, mutationClock) => {
        const changed = await mutation(stores, check, mutationClock)
        if (!changed.ok) {
          return changed
        }
        return readHoldoutChecks(
          { playerId },
          { bandStarts: stores.bandStarts, words: lessons, clock: mutationClock },
        )
      },
      dependencies,
    )
  routes.on(
    holdoutCheckDeclarations.readHoldoutChecks.method,
    honoPathOf(holdoutCheckDeclarations.readHoldoutChecks),
    signedInPlayer,
    async (c) => {
      const playerId = c.var.playerId
      const views = await inTransaction((stores) =>
        readHoldoutChecks({ playerId }, { bandStarts: stores.bandStarts, words: lessons, clock }),
      )
      return answerChecks(c, views)
    },
  )
  routes.on(
    holdoutCheckDeclarations.beginHoldoutCheck.method,
    honoPathOf(holdoutCheckDeclarations.beginHoldoutCheck),
    signedInPlayer,
    async (c) => {
      const check = HoldoutCheckRequestSchema.safeParse(c.req.param())
      if (!check.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      const playerId = c.var.playerId
      const views = await checksAfter(playerId, check.data, (stores, { band, week }, at) =>
        beginHoldoutCheck(
          { playerId, band, week },
          { ...stores, lessons, words: lessons, random, clock: at },
        ),
      )
      return answerChecks(c, views)
    },
  )
  routes.on(
    holdoutCheckDeclarations.answerHoldoutCheck.method,
    honoPathOf(holdoutCheckDeclarations.answerHoldoutCheck),
    signedInPlayer,
    async (c) => {
      const check = HoldoutCheckRequestSchema.safeParse(c.req.param())
      const request = HoldoutCheckAnswersSchema.safeParse(await bodyOf(c))
      if (!check.success || !request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      const playerId = c.var.playerId
      const views = await checksAfter(playerId, check.data, (stores, { band, week }, at) =>
        answerHoldoutCheck(
          { playerId, band, week, answers: request.data.answers },
          { bandStarts: stores.bandStarts, words: lessons, clock: at },
        ),
      )
      return answerChecks(c, views)
    },
  )
  routes.on(
    holdoutCheckDeclarations.skipHoldoutCheck.method,
    honoPathOf(holdoutCheckDeclarations.skipHoldoutCheck),
    signedInPlayer,
    async (c) => {
      const check = HoldoutCheckRequestSchema.safeParse(c.req.param())
      if (!check.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      const playerId = c.var.playerId
      const views = await checksAfter(playerId, check.data, (stores, { band, week }, at) =>
        skipHoldoutCheck({ playerId, band, week }, { bandStarts: stores.bandStarts, clock: at }),
      )
      return answerChecks(c, views)
    },
  )
  return routes
}
