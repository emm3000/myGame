export const honoPathOf = ({ path }: { readonly path: string }): string =>
  path.replace(/\{(\w+)\}/g, ':$1')
