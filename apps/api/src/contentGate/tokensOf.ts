export const tokensOf = (text: string): ReadonlyArray<string> =>
  text.toLowerCase().match(/[a-z]+/g) ?? []
