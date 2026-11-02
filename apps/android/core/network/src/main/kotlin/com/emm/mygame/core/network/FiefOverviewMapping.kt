package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.models.FiefOverview
import com.emm.mygame.core.network.generated.models.FiefOverviewResourcesWood
import com.emm.mygame.core.network.generated.models.FiefOverviewSlot
import com.emm.mygame.core.network.generated.models.FiefOverviewSlotOneOf1
import java.time.OffsetDateTime
import kotlin.time.Instant

internal fun FiefOverview.toSnapshot(): FiefSnapshot = FiefSnapshot(
    name = name,
    readAt = readAt.toKotlinInstant(),
    resources = listOf(
        resources.wood.toStoredResource(ResourceKind.Wood),
        resources.stone.toStoredResource(ResourceKind.Stone),
        resources.iron.toStoredResource(ResourceKind.Iron),
        resources.gold.toStoredResource(ResourceKind.Gold),
        resources.food.toStoredResource(ResourceKind.Food),
    ),
    slot = slot.toBuildSlot(),
)

private fun FiefOverviewResourcesWood.toStoredResource(kind: ResourceKind): StoredResource =
    StoredResource(kind = kind, amount = amount.toLong(), ratePerHour = ratePerHour, capacity = capacity.toLong())

private fun FiefOverviewSlot.toBuildSlot(): BuildSlot = when (this) {
    is FiefOverviewSlot.FiefOverviewSlotOneOfValue -> BuildSlot.Idle
    is FiefOverviewSlot.FiefOverviewSlotOneOf1Value -> BuildSlot.Busy(
        building = value.building.toBuildingKind(),
        targetLevel = value.targetLevel,
        finishesAt = value.finishesAt.toKotlinInstant(),
    )
}

private fun FiefOverviewSlotOneOf1.Building.toBuildingKind(): BuildingKind = when (this) {
    FiefOverviewSlotOneOf1.Building.sawmill -> BuildingKind.Sawmill
    FiefOverviewSlotOneOf1.Building.quarry -> BuildingKind.Quarry
    FiefOverviewSlotOneOf1.Building.ironMine -> BuildingKind.IronMine
    FiefOverviewSlotOneOf1.Building.farm -> BuildingKind.Farm
    FiefOverviewSlotOneOf1.Building.warehouse -> BuildingKind.Warehouse
    FiefOverviewSlotOneOf1.Building.library -> BuildingKind.Library
    FiefOverviewSlotOneOf1.Building.barracks -> BuildingKind.Barracks
}

private fun OffsetDateTime.toKotlinInstant(): Instant = Instant.fromEpochMilliseconds(toInstant().toEpochMilli())
