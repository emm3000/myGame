import type { DomainError } from '../DomainError'
import type { ChronicleWriter } from '../ports/ChronicleWriter'
import { err } from '../Result'

export const refusingChronicle = (refusal: DomainError): ChronicleWriter => ({
  record: async () => err(refusal),
})
