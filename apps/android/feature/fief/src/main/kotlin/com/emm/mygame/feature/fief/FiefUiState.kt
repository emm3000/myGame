package com.emm.mygame.feature.fief

import com.emm.mygame.core.network.ArtKind
import com.emm.mygame.core.network.BuildingKind
import com.emm.mygame.core.network.ResourceCost
import com.emm.mygame.core.network.ResourceKind
import com.emm.mygame.core.network.StudyRefusal
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
        val library: LibraryLine?,
    ) : FiefUiState

    data class LibraryLine(val slot: StudySlotLine, val arts: List<ArtCard>, val study: StudyStatus)

    sealed interface StudySlotLine {

        data object Idle : StudySlotLine

        data class Busy(
            val art: ArtKind,
            val targetLevel: Int,
            val remaining: Duration,
            val refund: List<ResourceCost>,
        ) : StudySlotLine
    }

    data class ArtCard(
        val kind: ArtKind,
        val level: Int,
        val resource: ResourceKind,
        val ratePercent: Int,
        val next: NextArtLine?,
    )

    data class NextArtLine(
        val level: Int,
        val ratePercent: Int,
        val costs: List<CostLine>,
        val duration: Duration,
        val requiredLibraryLevel: Int,
        val isLibraryTooLow: Boolean,
    )

    sealed interface StudyStatus {

        data object Idle : StudyStatus

        data object Waiting : StudyStatus

        data class Refused(val refusal: StudyRefusal) : StudyStatus

        data object Unreachable : StudyStatus
    }

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
