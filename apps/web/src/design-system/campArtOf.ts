import type { ProvinceMap } from '@mygame/contracts'

type CampTier = NonNullable<ProvinceMap['plots'][number]['camp']>['tier']

export function campArtOf(tier: CampTier): string {
  return `/art/camps/camp-${tier}.webp`
}
