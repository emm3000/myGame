import type { ReactElement } from 'react'

export interface CardArtProps {
  readonly src: string
  readonly isCappedAtFormWidth?: boolean
}

export function CardArt({ src, isCappedAtFormWidth = false }: CardArtProps): ReactElement {
  return (
    <img
      src={src}
      alt=""
      width={768}
      height={768}
      loading="lazy"
      decoding="async"
      className={`aspect-4/3 w-full rounded-md object-cover${isCappedAtFormWidth ? ' max-w-form' : ''}`}
    />
  )
}
