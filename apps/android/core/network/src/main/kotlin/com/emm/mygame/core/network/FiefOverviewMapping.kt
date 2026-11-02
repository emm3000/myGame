package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.models.BusyBuildSlot
import com.emm.mygame.core.network.generated.models.FiefOverview
import com.emm.mygame.core.network.generated.models.FiefOverviewResourcesWood
import com.emm.mygame.core.network.generated.models.BuildSlot as WireBuildSlot
import java.time.OffsetDateTime
import kotlin.time.Instant

internal fun FiefOverview.toSnapshot(): FiefSnapshot? {
    val buildSlot: BuildSlot = slot.toBuildSlot() ?: return null
    return FiefSnapshot(
        name = name,
        readAt = readAt.toKotlinInstant(),
        resources = listOf(
            resources.wood.toStoredResource(ResourceKind.Wood),
            resources.stone.toStoredResource(ResourceKind.Stone),
            resources.iron.toStoredResource(ResourceKind.Iron),
            resources.gold.toStoredResource(ResourceKind.Gold),
            resources.food.toStoredResource(ResourceKind.Food),
        ),
        slot = buildSlot,
    )
}

private fun FiefOverviewResourcesWood.toStoredResource(kind: ResourceKind): StoredResource =
    StoredResource(kind = kind, amount = amount.toLong(), ratePerHour = ratePerHour, capacity = capacity.toLong())

private fun WireBuildSlot.toBuildSlot(): BuildSlot? = when (this) {
    is WireBuildSlot.IdleWrapper -> BuildSlot.Idle
    is WireBuildSlot.BusyWrapper -> value.toBusySlot()
}

private fun BusyBuildSlot.toBusySlot(): BuildSlot? {
    val buildingKind: BuildingKind = building.toBuildingKind() ?: return null
    return BuildSlot.Busy(
        building = buildingKind,
        targetLevel = targetLevel,
        finishesAt = finishesAt.toKotlinInstant(),
    )
}

private fun BusyBuildSlot.Building.toBuildingKind(): BuildingKind? = when (this) {
    BusyBuildSlot.Building.sawmill -> BuildingKind.Sawmill
    BusyBuildSlot.Building.quarry -> BuildingKind.Quarry
    BusyBuildSlot.Building.ironMine -> BuildingKind.IronMine
    BusyBuildSlot.Building.farm -> BuildingKind.Farm
    BusyBuildSlot.Building.warehouse -> BuildingKind.Warehouse
    BusyBuildSlot.Building.library -> BuildingKind.Library
    BusyBuildSlot.Building.barracks -> BuildingKind.Barracks
    BusyBuildSlot.Building.unknown_default_open_api -> null
}

private fun OffsetDateTime.toKotlinInstant(): Instant = Instant.fromEpochMilliseconds(toInstant().toEpochMilli())
