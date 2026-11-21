import { fileURLToPath } from 'node:url'

const apiPackageRoot = new URL('../', import.meta.url)

export const apiPackagePath = (relativePath: string): string =>
  fileURLToPath(new URL(relativePath, apiPackageRoot))
