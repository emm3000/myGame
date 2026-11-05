import type { ArtTag } from './ArtTag'

const openingTag = /<([a-zA-Z][\w:-]*)([^>]*)>/g
const attribute = /([\w:-]+)="([^"]*)"/g

export function artTagsOf(svg: string): ReadonlyArray<ArtTag> {
  return [...svg.matchAll(openingTag)].map(([, name, rest]) => ({
    name: name ?? '',
    attributes: Object.fromEntries(
      [...(rest ?? '').matchAll(attribute)].map(([, key, value]) => [key, value]),
    ),
  }))
}
