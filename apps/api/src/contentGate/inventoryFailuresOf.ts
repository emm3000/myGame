import { cardWordEndings } from './cardWordEndingOf'
import { frameWordsOf } from './frameWordsOf'
import type { GateContent } from './GateContent'
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
    position: curriculum.lessonIds.indexOf(admittingLessonId) + 1,
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
  const endings: ReadonlyArray<string> = cardWordEndings
  const isFrameWordForm = (inflection: string): boolean =>
    !frameWords.has(inflection) &&
    [...(forms.get(inflection) ?? [])].some((word) => frameWords.has(word))
  return grammar.structures.flatMap(({ name, inflections }) =>
    inflections
      .filter((inflection) => !endings.includes(inflection) && !isFrameWordForm(inflection))
      .map(
        (inflection) =>
          `structure "${name}" lists ${inflection}, which is neither a form of a frame word nor ${cardWordEndings.slice(0, -1).join(', ')} or ${cardWordEndings.at(-1)}`,
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
