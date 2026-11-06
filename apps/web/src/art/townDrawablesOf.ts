import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { placeAtLevelOf } from './placeAtLevelOf'
import { windowCount } from './placeShapesOf'
import type { TownArt, TownDrawable } from './TownDrawable'
import { vectorDrawableOf } from './vectorDrawableOf'
import { wordDrawableOf } from './wordDrawableOf'

const publicArtDirectory = join(import.meta.dirname, '../../public/art')
const drawableDirectory = join(
  import.meta.dirname,
  '../../../android/core/designsystem/src/main/res/drawable',
)

type DrawableCut = { readonly prefix: string; readonly suffix: string; readonly contents: string }

type Family = {
  readonly directory: string
  readonly cutsOf: (svg: string) => ReadonlyArray<DrawableCut>
}

const levels = Array.from({ length: windowCount + 1 }, (_, level) => level)

const families: ReadonlyArray<Family> = [
  {
    directory: 'places',
    cutsOf: (svg) => [
      ...levels.map((level) => ({
        prefix: 'designsystem_place_',
        suffix: `_${level}`,
        contents: vectorDrawableOf(placeAtLevelOf(svg, level)),
      })),
      {
        prefix: 'designsystem_word_',
        suffix: '',
        contents: wordDrawableOf(placeAtLevelOf(svg, 0)),
      },
    ],
  },
  {
    directory: 'waste',
    cutsOf: (svg) => [{ prefix: 'designsystem_', suffix: '', contents: vectorDrawableOf(svg) }],
  },
]

function resourceNameOf(prefix: string, fileName: string): string {
  const snake = fileName
    .replace(/\.svg$/, '')
    .replace(/[A-Z]/g, (capital) => `_${capital.toLowerCase()}`)
    .replaceAll('-', '_')
  return `${prefix}${snake}`
}

function fileNamesOf(directory: string): ReadonlyArray<string> {
  const path = join(publicArtDirectory, directory)
  return existsSync(path)
    ? readdirSync(path)
        .filter((fileName) => fileName.endsWith('.svg'))
        .sort()
    : []
}

function artOf(directory: string, fileName: string): TownArt {
  const sourcePath = join(publicArtDirectory, directory, fileName)
  return { sourcePath, svg: readFileSync(sourcePath, 'utf8') }
}

export function townArtOf(): ReadonlyArray<TownArt> {
  return families.flatMap(({ directory }) =>
    fileNamesOf(directory).map((fileName) => artOf(directory, fileName)),
  )
}

function drawablesOf({ directory, cutsOf }: Family, fileName: string): ReadonlyArray<TownDrawable> {
  const art = artOf(directory, fileName)
  return cutsOf(art.svg).map(({ prefix, suffix, contents }) => ({
    ...art,
    path: join(drawableDirectory, `${resourceNameOf(prefix, fileName)}${suffix}.xml`),
    contents,
  }))
}

export function townDrawablesOf(): ReadonlyArray<TownDrawable> {
  return families.flatMap((family) =>
    fileNamesOf(family.directory).flatMap((fileName) => drawablesOf(family, fileName)),
  )
}
