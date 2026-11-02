package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.models.BusyBuildSlot
import com.emm.mygame.core.network.generated.models.FiefOverview
import com.emm.mygame.core.network.generated.models.FiefOverviewBuildings
import com.emm.mygame.core.network.generated.models.FiefOverviewBuildingsSawmill
import com.emm.mygame.core.network.generated.models.FiefOverviewBuildingsSawmillNextLevel
import com.emm.mygame.core.network.generated.models.FiefOverviewResourcesWood
import com.emm.mygame.core.network.generated.models.BuildSlot as WireBuildSlot
import java.time.OffsetDateTime
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant

internal fun FiefOverview.toSnapshot(): FiefSnapshot? {
    val buildSlot: BuildSlot = slot.toBuildSlot() ?: return null
    val buildingStates: List<BuildingState> = buildings.toBuildingStates() ?: return null
    return FiefSnapshot(
        id = FiefId(id.toString()),
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
        buildings = buildingStates,
        peasants = Peasants(free = peasants.projectedFree, supplied = peasants.projectedSupplied),
        queue = BuildQueue(waiting = queue.propertyEntries.size, cap = queue.cap),
    )
}

private fun FiefOverviewBuildings.toBuildingStates(): List<BuildingState>? {
    val drawn: List<Pair<BuildingKind, FiefOverviewBuildingsSawmill?>> = listOf(
        BuildingKind.Sawmill to sawmill,
        BuildingKind.Quarry to quarry,
        BuildingKind.IronMine to ironMine,
        BuildingKind.Farm to farm,
        BuildingKind.Warehouse to warehouse,
    )
    return drawn.map { (kind: BuildingKind, building: FiefOverviewBuildingsSawmill?) ->
        building?.toBuildingState(kind) ?: return null
    }
}

private fun FiefOverviewBuildingsSawmill.toBuildingState(kind: BuildingKind): BuildingState =
    BuildingState(kind = kind, level = level, nextLevel = nextLevel?.toNextLevel())

private fun FiefOverviewBuildingsSawmillNextLevel.toNextLevel(): NextLevel = NextLevel(
    level = level,
    cost = listOf(
        ResourceCost(ResourceKind.Wood, cost.wood.toLong()),
        ResourceCost(ResourceKind.Stone, cost.stone.toLong()),
        ResourceCost(ResourceKind.Iron, cost.iron.toLong()),
        ResourceCost(ResourceKind.Gold, cost.gold.toLong()),
        ResourceCost(ResourceKind.Food, cost.food.toLong()),
    ),
    duration = durationSeconds.seconds,
    peasants = peasants,
)

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
