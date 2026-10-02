import type { Fief, PlotAddress } from '@mygame/domain'

export const reservedPlotOf = ({ coordinates, march }: Fief): PlotAddress | undefined =>
  march.kind === 'away' && march.order === 'found' && march.recalledAt === undefined
    ? { kingdom: coordinates.kingdom, province: march.province, plot: march.plot }
    : undefined
