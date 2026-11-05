import { namesKingdomsVadoalto } from '@mygame/catalog'

const kingdomNames: Readonly<Partial<Record<number, () => string>>> = {
  1: namesKingdomsVadoalto,
}

export function kingdomNameOf(kingdom: number): string {
  return kingdomNames[kingdom]?.() ?? String(kingdom)
}
