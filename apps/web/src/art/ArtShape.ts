export type ArtShape =
  | {
      readonly kind: 'box'
      readonly left: number
      readonly top: number
      readonly right: number
      readonly bottom: number
    }
  | {
      readonly kind: 'circle'
      readonly centerX: number
      readonly centerY: number
      readonly radius: number
    }
  | { readonly kind: 'polygon'; readonly points: ReadonlyArray<readonly [number, number]> }
