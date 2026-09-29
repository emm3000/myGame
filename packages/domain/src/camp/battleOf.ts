export type Battle = {
  readonly won: boolean
  readonly infantryLost: number
  readonly campLost: number
  readonly survivors: number
}

export const battleOf = (
  infantry: number,
  campStrength: number,
  infantryStrength: number,
): Battle => {
  const ownStrength = infantry * infantryStrength
  if (ownStrength > campStrength) {
    const infantryLost = Math.min(
      infantry - 1,
      Math.ceil((campStrength * campStrength) / (infantry * infantryStrength * infantryStrength)),
    )
    return { won: true, infantryLost, campLost: campStrength, survivors: infantry - infantryLost }
  }
  const campLost = Math.min(campStrength - 1, Math.ceil((ownStrength * ownStrength) / campStrength))
  return { won: false, infantryLost: infantry, campLost, survivors: 0 }
}
