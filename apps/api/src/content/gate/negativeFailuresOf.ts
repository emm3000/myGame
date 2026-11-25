import type { GrammarPassage } from './grammarPassagesOf'

const contractedNegatives: ReadonlyMap<string, string> = new Map([
  ['do not', "don't"],
  ['does not', "doesn't"],
  ['did not', "didn't"],
  ['is not', "isn't"],
  ['are not', "aren't"],
  ['was not', "wasn't"],
  ['were not', "weren't"],
  ['have not', "haven't"],
  ['has not', "hasn't"],
  ['had not', "hadn't"],
  ['will not', "won't"],
  ['would not', "wouldn't"],
  ['could not', "couldn't"],
  ['should not', "shouldn't"],
  ['cannot', "can't"],
])

const negativesOf = (sentence: ReadonlyArray<string>): ReadonlyArray<string> =>
  sentence.flatMap((token, index) =>
    [token, sentence.slice(index, index + 2).join(' ')].filter((phrase) =>
      contractedNegatives.has(phrase),
    ),
  )

const isSpokenPassage = ({ kind }: GrammarPassage): boolean => kind === 'frame' || kind === 'text'

export const negativeFailuresOf = (
  passages: ReadonlyArray<GrammarPassage>,
): ReadonlyArray<string> =>
  passages
    .filter(isSpokenPassage)
    .flatMap(({ label, kind, sentences }) =>
      sentences
        .flatMap((sentence) => negativesOf(sentence))
        .map(
          (negative) =>
            `${label}: ${kind} holds ${negative}, a negative speech contracts to ${contractedNegatives.get(negative)}`,
        ),
    )
