import { OpenAPIHono } from '@hono/zod-openapi'
import {
  CallJobBackSchema,
  FoundTownSchema,
  type JobQuote,
  PlaceHiringOrderSchema,
  SendJobSchema,
  StartBuildingWorkSchema,
  StartLessonRequestSchema,
  StopBuildingWorkSchema,
  StopHiringOrderSchema,
  StopLessonRequestSchema,
  type TownNewsFeed,
  type TownOverview,
} from '@mygame/contracts'
import {
  callJobBack,
  type DomainError,
  err,
  type IdGenerator,
  Instant,
  type MemoryTerms,
  type PlacedOutBands,
  type PlayerId,
  placeHiringOrder,
  type RandomSource,
  type RegionMapReader,
  type Result,
  sendJob,
  startBuildingWork,
  startSchoolLesson,
  stopBuildingWork,
  stopHiringOrder,
  stopSchoolLesson,
} from '@mygame/domain'
import type { Context } from 'hono'
import { answerRefusal } from '../http/answerRefusal'
import { bodyOf } from '../http/bodyOf'
import { honoPathOf } from '../http/honoPath'
import { type NamedIssue, requestRefusalOf } from '../http/requestRefusalOf'
import { type RequirePlayerDependencies, requirePlayer } from '../http/requirePlayer'
import type { LessonLibrary } from '../learning/LessonLibrary'
import { type CurrentTownDependencies, currentTownOf } from '../town/currentTownOf'
import { foundTownOnFreeSite } from '../town/foundTownOnFreeSite'
import { mutateTown, type TownStores } from '../town/mutateTown'
import { quotedJobOf } from '../town/quotedJobOf'
import type { TownReading } from '../town/TownReading'
import { type TownNewsDependencies, townNewsOf } from '../town/townNewsOf'
import { townOverviewOf } from '../town/townOverviewOf'
import { townReadingOf } from '../town/townReadingOf'
import { townDeclarations } from './townDeclarations'

const foundingIssues: ReadonlyArray<NamedIssue> = [['name', 'too_small', { kind: 'BlankTownName' }]]

export type TownDependencies = CurrentTownDependencies &
  TownNewsDependencies &
  RequirePlayerDependencies & {
    readonly ids: IdGenerator
    readonly lessons: LessonLibrary
    readonly memoryTerms: MemoryTerms
    readonly random: RandomSource
    readonly placedOutBands: PlacedOutBands
    readonly regionMap: RegionMapReader
  }

const storedTownReadingOf = async (
  playerId: PlayerId,
  stores: TownStores,
  at: TownReading['at'],
): Promise<Result<TownReading, DomainError>> => {
  const town = await stores.towns.townOf(playerId)
  if (!town.ok) {
    return town
  }
  if (town.value === undefined) {
    return err({ kind: 'TownNotFound', playerId })
  }
  return townReadingOf(town.value, at, stores)
}

export const townRoutes = (dependencies: TownDependencies): OpenAPIHono => {
  const { townCatalog: catalog, lessons, memoryTerms, random, placedOutBands } = dependencies
  const answerReading = (c: Context, reading: Result<TownReading, DomainError>): Response => {
    if (!reading.ok) {
      return answerRefusal(c, reading.error)
    }
    const overview = townOverviewOf(reading.value, catalog, lessons, memoryTerms)
    if (!overview.ok) {
      return answerRefusal(c, overview.error)
    }
    const body: TownOverview = overview.value
    return c.json(body)
  }
  const signedInPlayer = requirePlayer(dependencies)
  const routes = new OpenAPIHono()
  for (const declaration of Object.values(townDeclarations)) {
    routes.openAPIRegistry.registerPath(declaration)
  }
  routes.on(
    townDeclarations.overview.method,
    honoPathOf(townDeclarations.overview),
    signedInPlayer,
    async (c) => answerReading(c, await currentTownOf(c.var.playerId, dependencies)),
  )
  routes.on(
    townDeclarations.news.method,
    honoPathOf(townDeclarations.news),
    signedInPlayer,
    async (c) => {
      const news = await townNewsOf(c.var.playerId, dependencies)
      if (!news.ok) {
        return answerRefusal(c, news.error)
      }
      const body: TownNewsFeed = news.value
      return c.json(body)
    },
  )
  routes.on(
    townDeclarations.found.method,
    honoPathOf(townDeclarations.found),
    signedInPlayer,
    async (c) => {
      const request = FoundTownSchema.safeParse(await bodyOf(c))
      if (!request.success) {
        return answerRefusal(c, requestRefusalOf(foundingIssues, request.error.issues))
      }
      const founded = await dependencies.inTransaction(async (stores) => {
        const town = await foundTownOnFreeSite(
          { playerId: c.var.playerId, name: request.data.name },
          {
            towns: stores.towns,
            skills: stores.earnedSkills,
            catalog,
            clock: dependencies.clock,
            ids: dependencies.ids,
          },
        )
        return town.ok ? townReadingOf(town.value, town.value.storedAt, stores) : town
      })
      return answerReading(c, founded)
    },
  )
  routes.on(
    townDeclarations.startWork.method,
    honoPathOf(townDeclarations.startWork),
    signedInPlayer,
    async (c) => {
      const request = StartBuildingWorkSchema.safeParse(await bodyOf(c))
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      const playerId = c.var.playerId
      const started = await mutateTown(
        playerId,
        async (stores, clock) => {
          const town = await startBuildingWork(
            { playerId, building: request.data.building },
            { towns: stores.towns, news: stores.townNews, catalog, clock },
          )
          return town.ok ? townReadingOf(town.value, town.value.storedAt, stores) : town
        },
        dependencies,
      )
      return answerReading(c, started)
    },
  )
  routes.on(
    townDeclarations.stopWork.method,
    honoPathOf(townDeclarations.stopWork),
    signedInPlayer,
    async (c) => {
      const request = StopBuildingWorkSchema.safeParse(c.req.param())
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      const playerId = c.var.playerId
      const stopped = await mutateTown(
        playerId,
        async (stores, clock) => {
          const change = await stopBuildingWork(
            { playerId, ...request.data },
            { towns: stores.towns, news: stores.townNews, catalog, clock },
          )
          if (!change.ok) {
            return change
          }
          const { town } = change.value
          return townReadingOf(town, town.storedAt, stores)
        },
        dependencies,
      )
      return answerReading(c, stopped)
    },
  )
  routes.on(
    townDeclarations.placeHiring.method,
    honoPathOf(townDeclarations.placeHiring),
    signedInPlayer,
    async (c) => {
      const request = PlaceHiringOrderSchema.safeParse(await bodyOf(c))
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      const playerId = c.var.playerId
      const placed = await mutateTown(
        playerId,
        async (stores, clock) => {
          const town = await placeHiringOrder(
            { playerId, ...request.data },
            { towns: stores.towns, news: stores.townNews, catalog, clock },
          )
          return town.ok ? townReadingOf(town.value, town.value.storedAt, stores) : town
        },
        dependencies,
      )
      return answerReading(c, placed)
    },
  )
  routes.on(
    townDeclarations.stopHiring.method,
    honoPathOf(townDeclarations.stopHiring),
    signedInPlayer,
    async (c) => {
      const request = StopHiringOrderSchema.safeParse(c.req.param())
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      const playerId = c.var.playerId
      const { hire, startedAt } = request.data
      const stopped = await mutateTown(
        playerId,
        async (stores, clock) => {
          const change = await stopHiringOrder(
            { playerId, hire, startedAt: Instant.fromEpochMilliseconds(Date.parse(startedAt)) },
            { towns: stores.towns, news: stores.townNews, catalog, clock },
          )
          if (!change.ok) {
            return change
          }
          const { town } = change.value
          return townReadingOf(town, town.storedAt, stores)
        },
        dependencies,
      )
      return answerReading(c, stopped)
    },
  )
  routes.on(
    townDeclarations.sendJob.method,
    honoPathOf(townDeclarations.sendJob),
    signedInPlayer,
    async (c) => {
      const request = SendJobSchema.safeParse(await bodyOf(c))
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      const playerId = c.var.playerId
      const sent = await mutateTown(
        playerId,
        async (stores, clock) => {
          const town = await sendJob(
            { playerId, ...request.data },
            { towns: stores.towns, map: stores.regionMap, news: stores.townNews, catalog, clock },
          )
          return town.ok ? townReadingOf(town.value, clock.now(), stores) : town
        },
        dependencies,
      )
      return answerReading(c, sent)
    },
  )
  routes.on(
    townDeclarations.quoteJob.method,
    honoPathOf(townDeclarations.quoteJob),
    signedInPlayer,
    async (c) => {
      const request = SendJobSchema.safeParse(await bodyOf(c))
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      const pay = await quotedJobOf({ playerId: c.var.playerId, ...request.data }, dependencies)
      if (!pay.ok) {
        return answerRefusal(c, pay.error)
      }
      const body: JobQuote = { pay: pay.value }
      return c.json(body)
    },
  )
  routes.on(
    townDeclarations.callJobBack.method,
    honoPathOf(townDeclarations.callJobBack),
    signedInPlayer,
    async (c) => {
      const request = CallJobBackSchema.safeParse(c.req.param())
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      const playerId = c.var.playerId
      const sentAt = Instant.fromEpochMilliseconds(Date.parse(request.data.sentAt))
      const calledBack = await mutateTown(
        playerId,
        async (stores, clock) => {
          const town = await callJobBack(
            { playerId, sentAt },
            { towns: stores.towns, news: stores.townNews, catalog, clock },
          )
          return town.ok ? townReadingOf(town.value, clock.now(), stores) : town
        },
        dependencies,
      )
      return answerReading(c, calledBack)
    },
  )
  routes.on(
    townDeclarations.startLesson.method,
    honoPathOf(townDeclarations.startLesson),
    signedInPlayer,
    async (c) => {
      const request = StartLessonRequestSchema.safeParse(await bodyOf(c))
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      const playerId = c.var.playerId
      const started = await mutateTown(
        playerId,
        async (stores, clock) => {
          const slot = await startSchoolLesson(
            { playerId, lessonId: request.data.lessonId },
            {
              ...stores,
              news: stores.townNews,
              lessons,
              bands: lessons,
              placedOutBands,
              random,
              catalog,
              clock,
            },
          )
          return slot.ok ? storedTownReadingOf(playerId, stores, clock.now()) : slot
        },
        dependencies,
      )
      return answerReading(c, started)
    },
  )
  routes.on(
    townDeclarations.stopLesson.method,
    honoPathOf(townDeclarations.stopLesson),
    signedInPlayer,
    async (c) => {
      const request = StopLessonRequestSchema.safeParse(c.req.param())
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      const playerId = c.var.playerId
      const stopped = await mutateTown(
        playerId,
        async (stores, clock) => {
          const change = await stopSchoolLesson(
            { playerId, lessonId: request.data.lessonId },
            { ...stores, news: stores.townNews, lessons, catalog, clock },
          )
          return change.ok ? storedTownReadingOf(playerId, stores, clock.now()) : change
        },
        dependencies,
      )
      return answerReading(c, stopped)
    },
  )
  return routes
}
