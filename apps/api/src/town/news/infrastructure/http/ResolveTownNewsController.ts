import { createRoute } from '@hono/zod-openapi'
import { type TownNewsItems, TownNewsItemsSchema } from '@mygame/contracts'
import type { ResolveTownNews } from '@mygame/domain'
import type { Context } from 'hono'
import type { SignedInPlayer } from '#account/infrastructure/http/requirePlayer'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { jsonResponse } from '#platform/infrastructure/http/responseDeclarations'
import { signedInDeclaration } from '#platform/infrastructure/http/signedInDeclaration'
import { townNotFoundResponse } from '../../../infrastructure/http/townComponents'
import { presentTownNewsItem } from './presentTownNewsItem'

export const resolveTownNewsDeclaration = createRoute(
  signedInDeclaration({
    method: 'get',
    path: '/news',
    responses: {
      200: jsonResponse(
        'The town’s news, newest first, after every finished work is applied: each item its kind, its params and its instant, no prose.',
        TownNewsItemsSchema,
      ),
      404: townNotFoundResponse,
    },
  }),
)

export type ResolveTownNewsControllerDependencies = {
  readonly resolveTownNews: ResolveTownNews
}

export class ResolveTownNewsController {
  constructor(private readonly dependencies: ResolveTownNewsControllerDependencies) {}

  async handle(c: Context<SignedInPlayer>): Promise<Response> {
    const news = await this.dependencies.resolveTownNews.execute(c.var.playerId)
    if (!news.ok) {
      return respondRefusal(c, news.error)
    }
    const body: TownNewsItems = { items: news.value.map(presentTownNewsItem) }
    return c.json(body)
  }
}
