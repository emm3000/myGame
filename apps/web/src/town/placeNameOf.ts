import type { BuildingKind } from '@mygame/contracts'
import type { ChromeCatalog } from '../copy/PlayerCopy'

const placeNames: Readonly<Record<BuildingKind, (catalog: ChromeCatalog) => string>> = {
  homes: (catalog) => catalog.namesPlacesHomes(),
  farm: (catalog) => catalog.namesPlacesFarm(),
  factory: (catalog) => catalog.namesPlacesFactory(),
  powerStation: (catalog) => catalog.namesPlacesPowerStation(),
  storage: (catalog) => catalog.namesPlacesStorage(),
  school: (catalog) => catalog.namesPlacesSchool(),
  office: (catalog) => catalog.namesPlacesOffice(),
}

export function placeNameOf(catalog: ChromeCatalog, place: BuildingKind): string {
  return placeNames[place](catalog)
}
