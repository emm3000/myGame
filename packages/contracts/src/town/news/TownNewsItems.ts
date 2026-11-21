import { z } from 'zod'
import { TownNewsItemSchema } from './TownNewsItem'

export const TownNewsFeedSchema = z
  .strictObject({ items: z.array(TownNewsItemSchema).max(100) })
  .meta({ id: 'TownNewsFeed' })

export type TownNewsFeed = z.infer<typeof TownNewsFeedSchema>
