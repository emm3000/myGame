import { cardWordInflections } from './cardWordFormOf'
import { contractionPieces } from './contractionPieces'
import { frameWordReadings } from './frameWordReadings'
import { frameWordsOf } from './frameWordsOf'
import type { GateContent } from './GateContent'
import { lessonPositionOf } from './lessonPositionOf'
import { repeated } from './repeated'

const unlistedLessonFailures = ({ grammar, curriculum }: GateContent): ReadonlyArray<string> =>
  grammar.structures
    .filter(({ admittingLessonId }) => !curriculum.lessonIds.includes(admittingLessonId))
    .map(
      ({ name, admittingLessonId }) =>
        `structure "${name}" is admitted by ${admittingLessonId}, which the curriculum does not list`,
    )

const orderFailures = ({ grammar, curriculum }: GateContent): ReadonlyArray<string> => {
  const admissions = grammar.structures.map(({ name, admittingLessonId }) => ({
    name,
    admittingLessonId,
    position: lessonPositionOf(curriculum, admittingLessonId),
  }))
  return admissions
    .filter(
      ({ position }, index) =>
        position > 0 && admissions.slice(0, index).some((above) => above.position > position),
    )
    .map(
      ({ name, admittingLessonId }) =>
        `structure "${name}" is admitted by ${admittingLessonId}, before a structure listed above it`,
    )
}

const unknownInflectionFailures = ({ grammar, forms }: GateContent): ReadonlyArray<string> => {
  const frameWords = frameWordsOf(grammar)
  const pieceOrCardInflections: ReadonlyArray<string> = [
    ...contractionPieces,
    ...frameWordReadings,
    ...cardWordInflections,
  ]
  const isFrameWordForm = (inflection: string): boolean =>
    !frameWords.has(inflection) &&
    [...(forms.get(inflection) ?? [])].some((word) => frameWords.has(word))
  return grammar.structures.flatMap(({ name, inflections }) =>
    inflections
      .filter(
        (inflection) =>
          !pieceOrCardInflections.includes(inflection) && !isFrameWordForm(inflection),
      )
      .map(
        (inflection) =>
          `structure "${name}" lists ${inflection}, which is neither a form of a frame word, a contraction piece nor ${cardWordInflections.slice(0, -1).join(', ')} or ${cardWordInflections.at(-1)}`,
      ),
  )
}

export const inventoryFailuresOf = (content: GateContent): ReadonlyArray<string> => [
  ...unlistedLessonFailures(content),
  ...orderFailures(content),
  ...repeated(content.grammar.structures.flatMap(({ inflections }) => inflections)).map(
    (inflection) => `inflection ${inflection} is listed more than once`,
  ),
  ...unknownInflectionFailures(content),
]
