import type { DomainError } from '@mygame/domain'

export type Refusal =
  | DomainError
  | { readonly kind: 'EmailTaken' }
  | { readonly kind: 'InvalidCredentials' }
  | { readonly kind: 'WeakPassword' }
  | { readonly kind: 'MalformedRequest' }
  | { readonly kind: 'SignedOut' }
