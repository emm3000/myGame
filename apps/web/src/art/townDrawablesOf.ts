import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { TownDrawable } from './TownDrawable'
import { vectorDrawableOf } from './vectorDrawableOf'

const publicArtDirectory = join(import.meta.dirname, '../../public/art')
const drawableDirectory = join(
  import.meta.dirname,
  '../../../android/core/designsystem/src/main/res/drawable',
)

const families = [
  { directory: 'places', prefix: 'designsystem_place_' },
  { directory: 'waste', prefix: 'designsystem_' },
]

function resourceNameOf(prefix: string, fileName: string): string {
  const snake = fileName
    .replace(/\.svg$/, '')
    .replace(/[A-Z]/g, (capital) => `_${capital.toLowerCase()}`)
    .replaceAll('-', '_')
  return `${prefix}${snake}`
}

function drawableOf(directory: string, prefix: string, fileName: string): TownDrawable {
  const sourcePath = join(publicArtDirectory, directory, fileName)
  const svg = readFileSync(sourcePath, 'utf8')
  return {
    sourcePath,
    svg,
    path: join(drawableDirectory, `${resourceNameOf(prefix, fileName)}.xml`),
    contents: vectorDrawableOf(svg),
  }
}

export function townDrawablesOf(): ReadonlyArray<TownDrawable> {
  return families.flatMap(({ directory, prefix }) =>
    readdirSync(join(publicArtDirectory, directory))
      .filter((fileName) => fileName.endsWith('.svg'))
      .sort()
      .map((fileName) => drawableOf(directory, prefix, fileName)),
  )
}
