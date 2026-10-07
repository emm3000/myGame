import type { Digest } from '@mygame/contracts'
import { chronicleRowOf } from '../chronicle/chronicleRowOf'
import { formatInstant } from '../chronicle/formatInstant'
import { copy } from '../copy'
import type { DigestFief, DigestRow } from '../design-system/DigestCard'

type DigestFiefEntry = Digest['fiefs'][number]

const eventRowsOf = (fief: DigestFiefEntry, readAt: Date): ReadonlyArray<DigestRow> =>
  fief.events.map((event) => {
    const { key, occurredAt, instant, heading, subject } = chronicleRowOf(event, readAt)
    return { key, occurredAt, instant, heading, subject }
  })

const storeRowsOf = (fief: DigestFiefEntry, readAt: Date): ReadonlyArray<DigestRow> =>
  fief.stores.map(({ resource, fullSince }) => ({
    key: `store-${resource}-${fullSince}`,
    occurredAt: fullSince,
    instant: formatInstant(new Date(fullSince), readAt),
    heading: copy.digest.storeFull,
    subject: copy.digest.storeSubject(resource),
  }))

const newestFirst = (left: DigestRow, right: DigestRow): number =>
  Date.parse(right.occurredAt) - Date.parse(left.occurredAt)

export function digestFiefsOf(digest: Digest, readAt: Date): ReadonlyArray<DigestFief> {
  return digest.fiefs.map((fief) => ({
    key: fief.id,
    name: fief.name,
    rows: [...eventRowsOf(fief, readAt), ...storeRowsOf(fief, readAt)].sort(newestFirst),
  }))
}
