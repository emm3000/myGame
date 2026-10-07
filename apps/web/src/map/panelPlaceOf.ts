export const panelPlaceOf = (position: number, columns: number, plotCount: number): number =>
  Math.min((Math.floor(position / columns) + 1) * columns, plotCount) - 1
