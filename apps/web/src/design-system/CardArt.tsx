import type { ReactElement } from 'react'

export type CardArtShape = 'wide' | 'square'

export interface CardArtProps {
  readonly src: string
  readonly shape?: CardArtShape | undefined
}

const shapeClass: Readonly<Record<CardArtShape, string>> = {
  wide: 'aspect-4/3 w-full object-cover',
  square: 'size-place-card self-center',
}

export function CardArt({ src, shape = 'wide' }: CardArtProps): ReactElement {
  return (
    <img
      src={src}
      alt=""
      width={768}
      height={768}
      loading="lazy"
      decoding="async"
      className={`rounded-md ${shapeClass[shape]}`}
    />
  )
}
