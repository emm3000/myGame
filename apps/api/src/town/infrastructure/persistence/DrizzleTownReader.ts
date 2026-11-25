import type { TownReader, TownWithSchool } from '@mygame/domain'
import { type DomainError, ok, type PlayerId, type Result } from '@mygame/domain'
import { eq } from 'drizzle-orm'
import { players } from '#account/infrastructure/persistence/accountTables'
import { storedScaffoldColumns } from '#account/infrastructure/persistence/storedScaffoldColumns'
import type { PostgresSession } from '#platform/infrastructure/persistence/connectPostgres'
import { aggregatedBandStartsOf, bandStartsFrom } from './aggregatedBandStarts'
import { aggregatedCardsOf, heldCardsOf } from './aggregatedCards'
import { aggregatedPlacementScoresOf, placementScoresFrom } from './aggregatedPlacementScores'
import { aggregatedSeenTipsOf, seenTipsFrom } from './aggregatedSeenTips'
import { aggregatedTown } from './aggregatedTown'
import { lessonSlotFromRow } from './lessonSlotFromRow'
import { townLessonSlots } from './schoolTables'
import { instantFromColumn, townFromRow } from './townFromRow'
import { towns } from './townTables'

export class DrizzleTownReader implements TownReader {
  constructor(private readonly database: PostgresSession) {}

  async townWithSchoolOf(
    playerId: PlayerId,
  ): Promise<Result<TownWithSchool | undefined, DomainError>> {
    const [row] = await this.database
      .select({
        town: towns,
        ...aggregatedTown,
        lessonSlot: townLessonSlots,
        cards: aggregatedCardsOf(towns.playerId),
        bandStarts: aggregatedBandStartsOf(towns.playerId),
        placementScores: aggregatedPlacementScoresOf(towns.playerId),
        seenTips: aggregatedSeenTipsOf(towns.playerId),
        ...storedScaffoldColumns,
      })
      .from(towns)
      .innerJoin(players, eq(players.id, towns.playerId))
      .leftJoin(townLessonSlots, eq(townLessonSlots.townId, towns.id))
      .where(eq(towns.playerId, playerId))
    if (row === undefined) {
      return ok(undefined)
    }
    const town = townFromRow(row)
    if (!town.ok) {
      return town
    }
    const cards = heldCardsOf(row.cards, playerId)
    if (!cards.ok) {
      return cards
    }
    const bandStarts = bandStartsFrom(row.bandStarts)
    if (!bandStarts.ok) {
      return bandStarts
    }
    const placementScores = placementScoresFrom(row.placementScores)
    if (!placementScores.ok) {
      return placementScores
    }
    return ok({
      town: town.value,
      lessonSlot: lessonSlotFromRow(row.lessonSlot),
      cards: cards.value,
      bandStarts: bandStarts.value,
      placementScores: placementScores.value,
      guidanceDismissedAt: instantFromColumn(row.town.guidanceDismissedAt) ?? undefined,
      seenAt: instantFromColumn(row.town.seenAt) ?? undefined,
      seenTips: seenTipsFrom(row.seenTips),
      scaffold: row.scaffold,
      scaffoldVersion: row.scaffoldVersion,
    })
  }
}
