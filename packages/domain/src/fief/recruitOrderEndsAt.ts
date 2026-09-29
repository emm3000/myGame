import { Instant } from '../time/Instant'
import type { OpenRecruitOrder } from './RecruitOrder'

const MILLISECONDS_PER_SECOND = 1_000

export const recruitOrderEndsAt = (order: OpenRecruitOrder): Instant =>
  Instant.fromEpochMilliseconds(
    order.startedAt.epochMilliseconds +
      order.count * order.perUnitSeconds * MILLISECONDS_PER_SECOND,
  )
