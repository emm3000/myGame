const wordPattern = /[a-z]+(?:'[a-z]+)?/g

const negativeStems: ReadonlyMap<string, string> = new Map([
  ['can', 'can'],
  ['won', 'will'],
])

const piecesOf = (word: string): ReadonlyArray<string> => {
  const [stem = word, suffix] = word.split("'")
  if (suffix === undefined) {
    return [word]
  }
  if (suffix === 't' && stem.endsWith('n')) {
    return [negativeStems.get(stem) ?? stem.slice(0, -1), "n't"]
  }
  return [stem, `'${suffix}`]
}

export const grammarTokensOf = (text: string): ReadonlyArray<string> =>
  (text.toLowerCase().replaceAll('’', "'").match(wordPattern) ?? []).flatMap((word) =>
    piecesOf(word),
  )
