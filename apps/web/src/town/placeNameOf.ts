import {
  namesPlacesFactory,
  namesPlacesFarm,
  namesPlacesHomes,
  namesPlacesOffice,
  namesPlacesPowerStation,
  namesPlacesSchool,
  namesPlacesStorage,
} from '@mygame/catalog'
import type { BuildingKind } from '@mygame/contracts/town'

const placeNames: Readonly<Record<BuildingKind, () => string>> = {
  homes: namesPlacesHomes,
  farm: namesPlacesFarm,
  factory: namesPlacesFactory,
  powerStation: namesPlacesPowerStation,
  storage: namesPlacesStorage,
  school: namesPlacesSchool,
  office: namesPlacesOffice,
}

export function placeNameOf(place: BuildingKind): string {
  return placeNames[place]()
}
