import type { ProvinceMap } from '@mygame/contracts'

type CampTier = NonNullable<ProvinceMap['plots'][number]['camp']>['tier']

export function campThumbnailOf(tier: CampTier): string {
  return `/art/camps/camp-${tier}-96.webp`
}
