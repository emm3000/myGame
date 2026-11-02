package com.emm.mygame.core.network

import kotlin.time.Instant

sealed interface ChronicleEvent {

    val occurredAt: Instant

    data class UpgradeFinished(val building: BuildingKind, val level: Int, override val occurredAt: Instant) :
        ChronicleEvent

    data class ArtLearned(val art: ArtKind, val level: Int, override val occurredAt: Instant) : ChronicleEvent

    data class UpgradeCancelled(
        val building: BuildingKind,
        val level: Int,
        val refund: List<ResourceQuantity>,
        override val occurredAt: Instant,
    ) : ChronicleEvent

    data class StudyCancelled(
        val art: ArtKind,
        val level: Int,
        val refund: List<ResourceQuantity>,
        override val occurredAt: Instant,
    ) : ChronicleEvent

    data class RecruitsDelivered(val unit: UnitKind, val count: Int, override val occurredAt: Instant) :
        ChronicleEvent

    data class RecruitsCancelled(
        val unit: UnitKind,
        val delivered: Int,
        val cancelled: Int,
        val refund: List<ResourceQuantity>,
        override val occurredAt: Instant,
    ) : ChronicleEvent

    data class MarchReturned(
        val plot: PlotAddress,
        val units: List<UnitCount>,
        val loot: List<ResourceQuantity>,
        val isRecalled: Boolean,
        override val occurredAt: Instant,
    ) : ChronicleEvent

    data class BattleFought(
        val plot: PlotAddress,
        val campTier: Int,
        val isWon: Boolean,
        val unitsLost: List<UnitCount>,
        val campLost: Int,
        override val occurredAt: Instant,
    ) : ChronicleEvent

    data class FoundingSent(val plot: PlotAddress, val fiefName: String, override val occurredAt: Instant) :
        ChronicleEvent

    data class FiefFounded(val plot: PlotAddress, val fiefName: String, override val occurredAt: Instant) :
        ChronicleEvent

    data class TransportSent(
        val plot: PlotAddress,
        val fiefName: String,
        val cargo: List<ResourceQuantity>,
        override val occurredAt: Instant,
    ) : ChronicleEvent

    data class TransportArrived(
        val plot: PlotAddress,
        val fiefName: String,
        val cargo: List<ResourceQuantity>,
        override val occurredAt: Instant,
    ) : ChronicleEvent
}
