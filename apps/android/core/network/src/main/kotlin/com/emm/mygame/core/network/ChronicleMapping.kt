package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.models.ArtLearnedEvent
import com.emm.mygame.core.network.generated.models.BattleFoughtEvent
import com.emm.mygame.core.network.generated.models.FiefEvent
import com.emm.mygame.core.network.generated.models.FiefFoundedEvent
import com.emm.mygame.core.network.generated.models.FiefOverviewBuildingsSawmillNextLevelCost
import com.emm.mygame.core.network.generated.models.FiefOverviewUnits
import com.emm.mygame.core.network.generated.models.FoundingSentEvent
import com.emm.mygame.core.network.generated.models.MarchReturnedEvent
import com.emm.mygame.core.network.generated.models.RecruitsCancelledEvent
import com.emm.mygame.core.network.generated.models.RecruitsDeliveredEvent
import com.emm.mygame.core.network.generated.models.StudyCancelledEvent
import com.emm.mygame.core.network.generated.models.TransportArrivedEvent
import com.emm.mygame.core.network.generated.models.TransportSentEvent
import com.emm.mygame.core.network.generated.models.UpgradeCancelledEvent
import com.emm.mygame.core.network.generated.models.UpgradeFinishedEvent

internal fun FiefEvent.toChronicleEvent(): ChronicleEvent? = when (this) {
    is FiefEvent.UpgradefinishedWrapper -> value.toChronicleEvent()
    is FiefEvent.ArtlearnedWrapper -> value.toChronicleEvent()
    is FiefEvent.UpgradecancelledWrapper -> value.toChronicleEvent()
    is FiefEvent.StudycancelledWrapper -> value.toChronicleEvent()
    is FiefEvent.RecruitsdeliveredWrapper -> value.toChronicleEvent()
    is FiefEvent.RecruitscancelledWrapper -> value.toChronicleEvent()
    is FiefEvent.MarchreturnedWrapper -> value.toChronicleEvent()
    is FiefEvent.BattlefoughtWrapper -> value.toChronicleEvent()
    is FiefEvent.FoundingsentWrapper -> value.toChronicleEvent()
    is FiefEvent.FieffoundedWrapper -> value.toChronicleEvent()
    is FiefEvent.TransportsentWrapper -> value.toChronicleEvent()
    is FiefEvent.TransportarrivedWrapper -> value.toChronicleEvent()
    is FiefEvent.LessonlearnedWrapper -> null
    is FiefEvent.LessoncancelledWrapper -> null
}

private fun UpgradeFinishedEvent.toChronicleEvent(): ChronicleEvent? {
    val kind: BuildingKind = buildingOf(building.value) ?: return null
    return ChronicleEvent.UpgradeFinished(building = kind, level = level, occurredAt = occurredAt.toKotlinInstant())
}

private fun ArtLearnedEvent.toChronicleEvent(): ChronicleEvent? {
    val kind: ArtKind = artOf(art.value) ?: return null
    return ChronicleEvent.ArtLearned(art = kind, level = level, occurredAt = occurredAt.toKotlinInstant())
}

private fun UpgradeCancelledEvent.toChronicleEvent(): ChronicleEvent? {
    val kind: BuildingKind = buildingOf(building.value) ?: return null
    return ChronicleEvent.UpgradeCancelled(
        building = kind,
        level = level,
        refund = refund.toQuantities(),
        occurredAt = occurredAt.toKotlinInstant(),
    )
}

private fun StudyCancelledEvent.toChronicleEvent(): ChronicleEvent? {
    val kind: ArtKind = artOf(art.value) ?: return null
    return ChronicleEvent.StudyCancelled(
        art = kind,
        level = level,
        refund = refund.toQuantities(),
        occurredAt = occurredAt.toKotlinInstant(),
    )
}

private fun RecruitsDeliveredEvent.toChronicleEvent(): ChronicleEvent? {
    val kind: UnitKind = unitOf(unit.value) ?: return null
    return ChronicleEvent.RecruitsDelivered(unit = kind, count = count, occurredAt = occurredAt.toKotlinInstant())
}

private fun RecruitsCancelledEvent.toChronicleEvent(): ChronicleEvent? {
    val kind: UnitKind = unitOf(unit.value) ?: return null
    return ChronicleEvent.RecruitsCancelled(
        unit = kind,
        delivered = delivered,
        cancelled = cancelled,
        refund = refund.toQuantities(),
        occurredAt = occurredAt.toKotlinInstant(),
    )
}

private fun MarchReturnedEvent.toChronicleEvent(): ChronicleEvent = ChronicleEvent.MarchReturned(
    plot = PlotAddress(province = province, plot = plot),
    units = units.toUnitCounts(),
    loot = loot.toQuantities(),
    isRecalled = recalled,
    occurredAt = occurredAt.toKotlinInstant(),
)

private fun BattleFoughtEvent.toChronicleEvent(): ChronicleEvent? {
    if (tier == BattleFoughtEvent.Tier.unknown_default_open_api) return null
    return ChronicleEvent.BattleFought(
        plot = PlotAddress(province = province, plot = plot),
        campTier = tier.value,
        isWon = won,
        unitsLost = unitsLost.toUnitCounts(),
        campLost = campLost,
        occurredAt = occurredAt.toKotlinInstant(),
    )
}

private fun FoundingSentEvent.toChronicleEvent(): ChronicleEvent = ChronicleEvent.FoundingSent(
    plot = PlotAddress(province = province, plot = plot),
    fiefName = name,
    occurredAt = occurredAt.toKotlinInstant(),
)

private fun FiefFoundedEvent.toChronicleEvent(): ChronicleEvent = ChronicleEvent.FiefFounded(
    plot = PlotAddress(province = province, plot = plot),
    fiefName = name,
    occurredAt = occurredAt.toKotlinInstant(),
)

private fun TransportSentEvent.toChronicleEvent(): ChronicleEvent = ChronicleEvent.TransportSent(
    plot = PlotAddress(province = province, plot = plot),
    fiefName = name,
    cargo = cargo.toQuantities(),
    occurredAt = occurredAt.toKotlinInstant(),
)

private fun TransportArrivedEvent.toChronicleEvent(): ChronicleEvent = ChronicleEvent.TransportArrived(
    plot = PlotAddress(province = province, plot = plot),
    fiefName = name,
    cargo = cargo.toQuantities(),
    occurredAt = occurredAt.toKotlinInstant(),
)

private fun FiefOverviewBuildingsSawmillNextLevelCost.toQuantities(): List<ResourceQuantity> = listOf(
    ResourceQuantity(ResourceKind.Wood, wood.toLong()),
    ResourceQuantity(ResourceKind.Stone, stone.toLong()),
    ResourceQuantity(ResourceKind.Iron, iron.toLong()),
    ResourceQuantity(ResourceKind.Gold, gold.toLong()),
    ResourceQuantity(ResourceKind.Food, food.toLong()),
)

private fun FiefOverviewUnits.toUnitCounts(): List<UnitCount> = listOf(
    UnitCount(UnitKind.Infantry, infantry),
    UnitCount(UnitKind.Cavalry, cavalry),
    UnitCount(UnitKind.Archer, archer),
    UnitCount(UnitKind.Settler, settler),
)
