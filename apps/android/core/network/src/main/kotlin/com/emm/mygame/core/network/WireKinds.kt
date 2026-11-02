package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.models.ArtLearnedEvent
import com.emm.mygame.core.network.generated.models.RecruitsDeliveredEvent
import com.emm.mygame.core.network.generated.models.UpgradeFinishedEvent

private val buildingsByWireName: Map<String, BuildingKind> = UpgradeFinishedEvent.Building.entries
    .mapNotNull { wire: UpgradeFinishedEvent.Building -> wire.toBuildingKind()?.let { kind -> wire.value to kind } }
    .toMap()

private val artsByWireName: Map<String, ArtKind> = ArtLearnedEvent.Art.entries
    .mapNotNull { wire: ArtLearnedEvent.Art -> wire.toArtKind()?.let { kind -> wire.value to kind } }
    .toMap()

private val unitsByWireName: Map<String, UnitKind> = RecruitsDeliveredEvent.Unit.entries
    .mapNotNull { wire: RecruitsDeliveredEvent.Unit -> wire.toUnitKind()?.let { kind -> wire.value to kind } }
    .toMap()

internal fun buildingOf(wireName: String): BuildingKind? = buildingsByWireName[wireName]

internal fun artOf(wireName: String): ArtKind? = artsByWireName[wireName]

internal fun unitOf(wireName: String): UnitKind? = unitsByWireName[wireName]

private fun UpgradeFinishedEvent.Building.toBuildingKind(): BuildingKind? = when (this) {
    UpgradeFinishedEvent.Building.sawmill -> BuildingKind.Sawmill
    UpgradeFinishedEvent.Building.quarry -> BuildingKind.Quarry
    UpgradeFinishedEvent.Building.ironMine -> BuildingKind.IronMine
    UpgradeFinishedEvent.Building.farm -> BuildingKind.Farm
    UpgradeFinishedEvent.Building.warehouse -> BuildingKind.Warehouse
    UpgradeFinishedEvent.Building.library -> BuildingKind.Library
    UpgradeFinishedEvent.Building.barracks -> BuildingKind.Barracks
    UpgradeFinishedEvent.Building.unknown_default_open_api -> null
}

private fun ArtLearnedEvent.Art.toArtKind(): ArtKind? = when (this) {
    ArtLearnedEvent.Art.smithing -> ArtKind.Smithing
    ArtLearnedEvent.Art.masonry -> ArtKind.Masonry
    ArtLearnedEvent.Art.unknown_default_open_api -> null
}

private fun RecruitsDeliveredEvent.Unit.toUnitKind(): UnitKind? = when (this) {
    RecruitsDeliveredEvent.Unit.infantry -> UnitKind.Infantry
    RecruitsDeliveredEvent.Unit.cavalry -> UnitKind.Cavalry
    RecruitsDeliveredEvent.Unit.archer -> UnitKind.Archer
    RecruitsDeliveredEvent.Unit.settler -> UnitKind.Settler
    RecruitsDeliveredEvent.Unit.unknown_default_open_api -> null
}
