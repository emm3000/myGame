package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.models.BusyBuildSlot
import com.emm.mygame.core.network.generated.models.FiefOverview
import com.emm.mygame.core.network.generated.models.FiefOverviewBuildings
import com.emm.mygame.core.network.generated.models.FiefOverviewBuildingsSawmill
import com.emm.mygame.core.network.generated.models.FiefOverviewBuildingsSawmillNextLevel
import com.emm.mygame.core.network.generated.models.FiefOverviewBuildingsSawmillNextLevelCost
import com.emm.mygame.core.network.generated.models.FiefOverviewQueue
import com.emm.mygame.core.network.generated.models.FiefOverviewQueueEntriesInner
import com.emm.mygame.core.network.generated.models.FiefOverviewResourcesWood
import com.emm.mygame.core.network.generated.models.BuildSlot as WireBuildSlot
import java.time.OffsetDateTime
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant

internal fun FiefOverview.toSnapshot(): FiefSnapshot? {
    val buildSlot: BuildSlot? = slot.toBuildSlot()
    val buildQueue: BuildQueue? = queue.toBuildQueue()
    val studySlot: StudySlot? = study.toStudySlot()
    val artStates: List<ArtState>? = arts.toArtStates()
    if (buildSlot == null || buildQueue == null) return null
    val army: MappedArmy? = toArmy()
    if (studySlot == null || artStates == null || army == null) return null
    val mapped: MappedMarch = army.marching
    return FiefSnapshot(
        id = FiefId(id.toString()),
        name = name,
        readAt = readAt.toKotlinInstant(),
        coordinates = mapped.coordinates,
        resources = listOf(
            resources.wood.toStoredResource(ResourceKind.Wood),
            resources.stone.toStoredResource(ResourceKind.Stone),
            resources.iron.toStoredResource(ResourceKind.Iron),
            resources.gold.toStoredResource(ResourceKind.Gold),
            resources.food.toStoredResource(ResourceKind.Food),
        ),
        slot = buildSlot,
        buildings = buildings.toBuildingStates(),
        peasants = Peasants(
            free = peasants.projectedFree,
            supplied = peasants.projectedSupplied,
            lowestFree = peasants.lowestFree,
        ),
        queue = buildQueue,
        study = studySlot,
        arts = artStates,
        units = army.units,
        recruitOrder = army.recruitOrder,
        march = mapped.march,
        forageTerms = mapped.forageTerms,
        season = mapped.season,
        combatTerms = CombatTerms(lootPerStrength = combatTerms.lootPerStrength),
    )
}

private fun FiefOverviewBuildings.toBuildingStates(): List<BuildingState> {
    val drawn: List<Pair<BuildingKind, FiefOverviewBuildingsSawmill>> = listOf(
        BuildingKind.Sawmill to sawmill,
        BuildingKind.Quarry to quarry,
        BuildingKind.IronMine to ironMine,
        BuildingKind.Farm to farm,
        BuildingKind.Warehouse to warehouse,
        BuildingKind.Library to library,
        BuildingKind.Barracks to barracks,
    )
    return drawn.map { (kind: BuildingKind, building: FiefOverviewBuildingsSawmill) -> building.toBuildingState(kind) }
}

private fun FiefOverviewBuildingsSawmill.toBuildingState(kind: BuildingKind): BuildingState =
    BuildingState(kind = kind, level = level, nextLevel = nextLevel?.toNextLevel())

private fun FiefOverviewBuildingsSawmillNextLevel.toNextLevel(): NextLevel = NextLevel(
    level = level,
    cost = cost.toResourceCosts(),
    duration = durationSeconds.seconds,
    peasants = peasants,
)

internal fun FiefOverviewBuildingsSawmillNextLevelCost.toResourceCosts(): List<ResourceCost> = listOf(
    ResourceCost(ResourceKind.Wood, wood.toLong()),
    ResourceCost(ResourceKind.Stone, stone.toLong()),
    ResourceCost(ResourceKind.Iron, iron.toLong()),
    ResourceCost(ResourceKind.Gold, gold.toLong()),
    ResourceCost(ResourceKind.Food, food.toLong()),
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

private fun FiefOverviewQueue.toBuildQueue(): BuildQueue? {
    val entries: List<WaitingUpgrade> = propertyEntries.mapNotNull { entry: FiefOverviewQueueEntriesInner ->
        entry.toWaitingUpgrade()
    }
    return if (entries.size == propertyEntries.size) BuildQueue(entries = entries, cap = cap) else null
}

private fun FiefOverviewQueueEntriesInner.toWaitingUpgrade(): WaitingUpgrade? {
    val buildingKind: BuildingKind = building.toBuildingKind() ?: return null
    return WaitingUpgrade(building = buildingKind, targetLevel = targetLevel, finishesAt = finishesAt.toKotlinInstant())
}

private fun FiefOverviewQueueEntriesInner.Building.toBuildingKind(): BuildingKind? = when (this) {
    FiefOverviewQueueEntriesInner.Building.sawmill -> BuildingKind.Sawmill
    FiefOverviewQueueEntriesInner.Building.quarry -> BuildingKind.Quarry
    FiefOverviewQueueEntriesInner.Building.ironMine -> BuildingKind.IronMine
    FiefOverviewQueueEntriesInner.Building.farm -> BuildingKind.Farm
    FiefOverviewQueueEntriesInner.Building.warehouse -> BuildingKind.Warehouse
    FiefOverviewQueueEntriesInner.Building.library -> BuildingKind.Library
    FiefOverviewQueueEntriesInner.Building.barracks -> BuildingKind.Barracks
    FiefOverviewQueueEntriesInner.Building.unknown_default_open_api -> null
}

internal fun OffsetDateTime.toKotlinInstant(): Instant = Instant.fromEpochMilliseconds(toInstant().toEpochMilli())
