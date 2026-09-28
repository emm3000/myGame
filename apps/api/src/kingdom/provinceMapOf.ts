import type { ProvinceMap as WireProvinceMap } from '@mygame/contracts'
import type { ProvinceMap } from '@mygame/domain'

export const provinceMapOf = (map: ProvinceMap): WireProvinceMap => ({
  kingdom: map.kingdom,
  province: map.province,
  lastProvince: map.lastProvince,
  terrain: map.terrain,
  plots: map.plots.map(({ plot, fief }) => ({
    plot,
    fief: fief === undefined ? null : { name: fief.name, isOwn: fief.isOwn },
  })),
})
