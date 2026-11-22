import type { TownOverview } from '@mygame/contracts'
import type { BusyWorkSlot } from '@mygame/domain'
import { isoOf } from '#platform/infrastructure/http/isoOf'
import type { WorkView } from '../../application/gatherWorkView'

type BuildingWork = TownOverview['work']['waitingList'][number]

const presentBuildingWork = ({
  building,
  level,
  cost,
  startedAt,
  finishesAt,
}: BusyWorkSlot): BuildingWork => ({
  building,
  level,
  cost: { ...cost },
  startsAt: isoOf(startedAt),
  finishesAt: isoOf(finishesAt),
})

export const presentTownWork = ({ slot, waitingList, cap }: WorkView): TownOverview['work'] => ({
  slot: slot === null ? null : presentBuildingWork(slot),
  waitingList: waitingList.map(presentBuildingWork),
  cap,
})
