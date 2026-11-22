import { readScaffold } from '#account/application/readScaffold'
import type { DomainError } from '#DomainError'
import type { Band } from '#learning/curriculum/domain/Band'
import type { Scaffold } from '#learning/scaffold/domain/Scaffold'
import type { PlacementWordCatalog } from '#placement/domain/PlacementWordCatalog'
import { placementQuestionsOf } from '#placement/domain/placementQuestionsOf'
import { type PlacementAnswer, rightWordIdsOf } from '#placement/domain/rightWordIdsOf'
import type { Clock } from '#platform/domain/Clock'
import type { PlayerId } from '#player/PlayerId'
import { err, ok, type Result } from '#Result'
import { resolveDueBandStart } from '../application/resolveDueBandStart'
import type { BandStartRepository } from '../domain/BandStartRepository'
import { checkOfWeek } from '../domain/checkOfWeek'
import type { TakenHoldoutCheck } from '../domain/HoldoutCheck'
import type { HoldoutCheckView } from '../domain/HoldoutCheckView'
import type { HoldoutCheckWeek } from '../domain/HoldoutCheckWeek'
import { type MutateHoldoutCheckDependencies, mutateHoldoutCheck } from './mutateHoldoutCheck'

export type AnswerHoldoutCheckCommand = {
  readonly playerId: PlayerId
  readonly band: Band
  readonly week: HoldoutCheckWeek
  readonly answers: ReadonlyArray<PlacementAnswer>
}

type ScaffoldedAnswers = AnswerHoldoutCheckCommand & {
  readonly scaffold: Scaffold
}

type AnswerPorts = {
  readonly bandStarts: BandStartRepository
  readonly words: PlacementWordCatalog
  readonly clock: Clock
}

const answerHoldoutCheckIn = async (
  { playerId, band, week, answers, scaffold }: ScaffoldedAnswers,
  { bandStarts, words, clock }: AnswerPorts,
): Promise<Result<TakenHoldoutCheck, DomainError>> => {
  const now = clock.now()
  const due = await resolveDueBandStart(playerId, band, week, bandStarts, now)
  if (!due.ok) {
    return due
  }
  const begun = checkOfWeek(due.value, week)
  if (begun?.kind !== 'begun') {
    return err({ kind: 'HoldoutCheckNotBegun', band, week })
  }
  const { sample } = begun
  const questions = placementQuestionsOf({ band, wordIds: sample.wordIds }, words, scaffold)
  const right = rightWordIdsOf(questions, answers)
  if (right === undefined) {
    return err({ kind: 'InvalidHoldoutCheckAnswers', band, week })
  }
  const heldOutScore = right.filter((wordId) => sample.heldOutWordIds.includes(wordId)).length
  const taken: TakenHoldoutCheck = {
    ...begun,
    kind: 'taken',
    heldOutScore,
    practisedScore: right.length - heldOutScore,
    takenAt: now,
  }
  const saved = await bandStarts.saveCheck(playerId, band, taken)
  return saved.ok ? ok(taken) : saved
}

export type AnswerHoldoutCheckDependencies = MutateHoldoutCheckDependencies

export class AnswerHoldoutCheck {
  constructor(private readonly dependencies: AnswerHoldoutCheckDependencies) {}

  async execute(
    command: AnswerHoldoutCheckCommand,
  ): Promise<Result<ReadonlyArray<HoldoutCheckView>, DomainError>> {
    const { lessons } = this.dependencies
    return mutateHoldoutCheck(
      command,
      async (stores, { band, week }, at) => {
        const scaffold = await readScaffold(command.playerId, stores.accounts)
        if (!scaffold.ok) {
          return scaffold
        }
        return answerHoldoutCheckIn(
          {
            playerId: command.playerId,
            band,
            week,
            answers: command.answers,
            scaffold: scaffold.value,
          },
          { bandStarts: stores.bandStarts, words: lessons, clock: at },
        )
      },
      this.dependencies,
    )
  }
}
