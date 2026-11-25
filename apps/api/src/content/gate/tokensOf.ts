const cliticPattern = /(?<=[a-z])['’][a-z]+/g

export const tokensOf = (text: string): ReadonlyArray<string> =>
  text
    .toLowerCase()
    .replaceAll(cliticPattern, '')
    .match(/[a-z]+/g) ?? []
