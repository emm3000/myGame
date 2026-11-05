export type ArtShape =
  | {
      readonly kind: 'box'
      readonly left: number
      readonly top: number
      readonly right: number
      readonly bottom: number
    }
  | {
      readonly kind: 'oval'
      readonly centerX: number
      readonly centerY: number
      readonly radiusX: number
      readonly radiusY: number
    }
  | { readonly kind: 'polygon'; readonly points: ReadonlyArray<readonly [number, number]> }
