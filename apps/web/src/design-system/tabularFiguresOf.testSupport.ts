export const tabularFiguresOf = (line: Element): ReadonlyArray<string | null> =>
  Array.from(line.querySelectorAll('.tabular-nums'), (figure) => figure.textContent)
