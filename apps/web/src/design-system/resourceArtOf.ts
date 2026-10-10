import type { Accent } from './resourceAccent'

const resourceArt: Readonly<Record<Accent, string | undefined>> = {
  wood: '/art/resources/wood-1-96.webp',
  stone: '/art/resources/stone-1-96.webp',
  iron: '/art/resources/iron-1-96.webp',
  gold: '/art/resources/gold-1-96.webp',
  food: '/art/resources/food-1-96.webp',
  peasants: undefined,
}

export function resourceArtOf(accent: Accent): string | undefined {
  return resourceArt[accent]
}
