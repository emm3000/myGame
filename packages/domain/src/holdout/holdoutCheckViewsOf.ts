import type { BandStart } from '../learning/BandStart'
import type { Scaffold } from '../learning/Scaffold'
import type { PlacementWordCatalog } from '../ports/PlacementWordCatalog'
import type { Instant } from '../time/Instant'
import { askingViewOf } from './askingViewOf'
import { checkOfWeek } from './checkOfWeek'
import type { HoldoutCheckView } from './HoldoutCheckView'
import { dueWeeksOf } from './holdoutCheckWeeks'

export const holdoutCheckViewsOf = (
  starts: ReadonlyArray<BandStart>,
  words: PlacementWordCatalog,
  now: Instant,
  scaffold: Scaffold,
): ReadonlyArray<HoldoutCheckView> =>
  starts.flatMap((start) =>
    dueWeeksOf(start, now).map((week): HoldoutCheckView => {
      const { band } = start
      const begun = checkOfWeek(start, week)
      return begun?.kind === 'begun'
        ? askingViewOf(band, begun, words, scaffold)
        : { kind: 'due', band, week }
    }),
  )
