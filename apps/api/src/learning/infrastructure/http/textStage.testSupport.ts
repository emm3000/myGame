import { type OpenText, OpenTextSchema } from '@mygame/contracts'
import type { ComposedServer } from '#composeServer'
import { runSql, type TownApp } from '#town/infrastructure/http/townRoutes.testSupport'

export type TextReading = {
  readonly wordIdsUpTo: (lessonId: string) => ReadonlyArray<string>
  readonly holdCards: (
    email: string,
    wordIds: ReadonlyArray<string>,
    stability: number,
  ) => Promise<void>
  readonly setStability: (wordId: string, stability: number) => Promise<void>
  readonly readText: (cookie: string, textId: string) => Promise<Response>
  readonly textOf: (response: Response) => Promise<OpenText>
  readonly supportOf: (text: OpenText, word: string) => unknown
}

export const textReading = (serverOf: () => ComposedServer, appOf: () => TownApp): TextReading => {
  const wordIdsUpTo = (lessonId: string): ReadonlyArray<string> => {
    const curriculum = serverOf().lessons.lessons()
    const last = curriculum.findIndex(({ id }) => id === lessonId)
    return curriculum.slice(0, last + 1).flatMap(({ words }) => words.map(({ id }) => id))
  }

  const holdCards = (
    email: string,
    wordIds: ReadonlyArray<string>,
    stability: number,
  ): Promise<void> =>
    runSql(
      `INSERT INTO cards (player_id, word_id, state, stability, difficulty, last_review_at, last_rating, entered_at) SELECT id, word_id, 'review', ${stability}, 5, '2026-11-01T08:00:00Z', 'good', '2026-11-01T07:00:00Z' FROM players, unnest(ARRAY[${wordIds.map((id) => `'${id}'`).join(', ')}]) word_id WHERE email = '${email}'`,
    )

  const setStability = (wordId: string, stability: number): Promise<void> =>
    runSql(`UPDATE cards SET stability = ${stability} WHERE word_id = '${wordId}'`)

  const readText = (cookie: string, textId: string): Promise<Response> =>
    Promise.resolve(appOf().request(`/town/texts/${textId}`, { headers: { cookie } }))

  const textOf = async (response: Response): Promise<OpenText> =>
    OpenTextSchema.parse(await response.json())

  const supportOf = (text: OpenText, word: string): unknown =>
    text.sentences.flat().find((span) => span.text === word)?.support

  return { wordIdsUpTo, holdCards, setStability, readText, textOf, supportOf }
}
