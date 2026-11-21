export type DurationError =
  | { readonly kind: 'NegativeDuration'; readonly seconds: number }
  | { readonly kind: 'FractionalDuration'; readonly seconds: number }
