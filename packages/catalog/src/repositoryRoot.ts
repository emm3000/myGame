import { fileURLToPath } from 'node:url'

export const repositoryRoot: string = fileURLToPath(new URL('../../../', import.meta.url))
