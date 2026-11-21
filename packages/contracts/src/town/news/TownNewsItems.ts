import { z } from 'zod'
import { TownNewsItemSchema } from './TownNewsItem'

export const TownNewsItemsSchema = z
  .strictObject({ items: z.array(TownNewsItemSchema).max(100) })
  .meta({ id: 'TownNewsItems' })

export type TownNewsItems = z.infer<typeof TownNewsItemsSchema>
