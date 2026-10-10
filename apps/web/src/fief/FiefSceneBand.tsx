import type { FiefOverview } from '@mygame/contracts'
import type { ReactElement } from 'react'
import { SceneBand } from '../design-system/SceneBand'
import { sceneArtOf } from '../design-system/sceneArtOf'

export function FiefSceneBand({ overview }: { readonly overview: FiefOverview }): ReactElement {
  return (
    <SceneBand
      terrain={overview.terrain}
      season={overview.season?.kind ?? null}
      artSrc={sceneArtOf(overview.terrain)}
    />
  )
}
