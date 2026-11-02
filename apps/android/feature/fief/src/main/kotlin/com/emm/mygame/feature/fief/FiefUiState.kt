package com.emm.mygame.feature.fief

import com.emm.mygame.core.network.BuildingKind
import com.emm.mygame.core.network.ResourceKind
import com.emm.mygame.core.network.UpgradeRefusal
import kotlin.time.Duration
import kotlin.time.Instant

sealed interface FiefUiState {

    data object Loading : FiefUiState

    data object Failed : FiefUiState

    data object SigningOut : FiefUiState

    data class Content(
        val name: String,
        val resources: List<ResourceLine>,
        val peasants: PeasantsLine,
        val slot: SlotLine,
        val buildings: List<BuildingCard>,
        val queue: List<WaitingLine>,
        val upgrade: UpgradeStatus,
        val cancel: CancelStatus,
    ) : FiefUiState

    data class ResourceLine(val kind: ResourceKind, val amount: Long, val capacity: Long, val ratePerHour: Long) {

        val isFull: Boolean
            get() = amount >= capacity
    }

    data class PeasantsLine(val free: Int, val supplied: Int)

    sealed interface SlotLine {

        data object Idle : SlotLine

        data class Busy(val building: BuildingKind, val targetLevel: Int, val remaining: Duration) : SlotLine
    }

    data class WaitingLine(
        val building: BuildingKind,
        val targetLevel: Int,
        val remaining: Duration,
        val finishesAt: Instant,
    )

    data class UpgradeTarget(val building: BuildingKind, val targetLevel: Int)

    data class BuildingCard(val kind: BuildingKind, val level: Int, val next: NextLevelLine?, val block: BlockReason?)

    data class NextLevelLine(
        val level: Int,
        val costs: List<CostLine>,
        val duration: Duration,
        val peasants: Int,
        val isShortOfPeasants: Boolean,
    )

    data class CostLine(val kind: ResourceKind, val amount: Long, val isShort: Boolean)

    data class Shortfall(val kind: ResourceKind, val amount: Long)

    sealed interface BlockReason {

        data object QueueFull : BlockReason

        data class Peasants(val needed: Int, val free: Int) : BlockReason

        data class Resources(val shortfalls: List<Shortfall>) : BlockReason
    }

    sealed interface UpgradeStatus {

        data object Idle : UpgradeStatus

        data class Waiting(val building: BuildingKind) : UpgradeStatus

        data class Refused(val building: BuildingKind, val refusal: UpgradeRefusal) : UpgradeStatus

        data class Unreachable(val building: BuildingKind) : UpgradeStatus
    }

    sealed interface CancelStatus {

        data object Idle : CancelStatus

        data class Waiting(val target: UpgradeTarget) : CancelStatus

        data class Refused(val target: UpgradeTarget) : CancelStatus

        data class Unreachable(val target: UpgradeTarget) : CancelStatus
    }
}
