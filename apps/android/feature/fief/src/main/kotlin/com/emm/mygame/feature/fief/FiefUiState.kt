package com.emm.mygame.feature.fief

import com.emm.mygame.core.network.ArtKind
import com.emm.mygame.core.network.BuildingKind
import com.emm.mygame.core.network.MarchCamp
import com.emm.mygame.core.network.MarchRefusal
import com.emm.mygame.core.network.PlotAddress
import com.emm.mygame.core.network.RecruitRefusal
import com.emm.mygame.core.network.ResourceCost
import com.emm.mygame.core.network.ResourceKind
import com.emm.mygame.core.network.ResourceQuantity
import com.emm.mygame.core.network.SeasonKind
import com.emm.mygame.core.network.StudyRefusal
import com.emm.mygame.core.network.UnitCount
import com.emm.mygame.core.network.UnitKind
import com.emm.mygame.core.network.UpgradeRefusal
import com.emm.mygame.core.projection.MarchPhase
import kotlin.time.Duration
import kotlin.time.Instant

sealed interface FiefUiState {

    data object Loading : FiefUiState

    data object Failed : FiefUiState

    data object SigningOut : FiefUiState

    data class Content(
        val name: String,
        val season: SeasonLine?,
        val resources: List<ResourceLine>,
        val peasants: PeasantsLine,
        val slot: SlotLine,
        val buildings: List<BuildingCard>,
        val queue: List<WaitingLine>,
        val upgrade: UpgradeStatus,
        val cancel: CancelStatus,
        val library: LibraryLine?,
        val army: ArmyLine?,
    ) : FiefUiState

    data class SeasonLine(val kind: SeasonKind, val year: Int, val next: SeasonKind, val countdown: SeasonCountdown)

    sealed interface SeasonCountdown {

        data class InDays(val days: Int) : SeasonCountdown

        data class UnderADay(val remaining: Duration) : SeasonCountdown

        data class InSeconds(val seconds: Int) : SeasonCountdown
    }

    data class ArmyLine(
        val slot: LevySlotLine,
        val march: MarchSlotLine,
        val units: List<UnitCard>,
        val recruit: RecruitStatus,
        val recall: RecallStatus,
    )

    sealed interface MarchSlotLine {

        data object Idle : MarchSlotLine

        data class Busy(
            val phase: MarchPhase,
            val heading: MarchHeading,
            val units: List<UnitCount>,
            val target: PlotAddress,
            val detail: MarchDetail?,
            val countdown: MarchCountdown,
            val remaining: Duration,
            val loot: List<ResourceQuantity>,
            val departedAt: Instant,
        ) : MarchSlotLine {

            val isRecallable: Boolean
                get() = phase != MarchPhase.Returning
        }
    }

    enum class MarchHeading {
        Outbound,
        Foraging,
        Returning,
        AttackOutbound,
        AttackReturning,
        FoundingOutbound,
        TransportOutbound,
        TransportReturning,
    }

    sealed interface MarchDetail {

        data class Camp(val camp: MarchCamp) : MarchDetail

        data class NewFief(val name: String) : MarchDetail

        data class Cargo(val cargo: List<ResourceQuantity>) : MarchDetail
    }

    enum class MarchCountdown {
        Return,
        Arrival,
    }

    sealed interface RecallStatus {

        data object Idle : RecallStatus

        data object Waiting : RecallStatus

        data class Refused(val refusal: MarchRefusal) : RecallStatus

        data object Unreachable : RecallStatus
    }

    sealed interface LevySlotLine {

        data object Idle : LevySlotLine

        data class Busy(
            val unit: UnitKind,
            val count: Int,
            val delivered: Int,
            val remaining: Duration,
            val startedAt: Instant,
            val refund: List<ResourceCost>,
        ) : LevySlotLine {

            val undelivered: Int
                get() = count - delivered
        }
    }

    sealed interface UnitCard {

        val kind: UnitKind

        val atHome: Int

        val away: Int

        data class Locked(
            override val kind: UnitKind,
            override val atHome: Int,
            override val away: Int,
            val requiredLevel: Int,
            val builtLevel: Int,
        ) : UnitCard

        data class Open(
            override val kind: UnitKind,
            override val atHome: Int,
            override val away: Int,
            val entry: String,
            val isEntryLocked: Boolean,
            val order: RecruitLine?,
            val block: RecruitBlock?,
        ) : UnitCard
    }

    data class RecruitLine(
        val count: Int,
        val costs: List<CostLine>,
        val peasants: Int,
        val isShortOfPeasants: Boolean,
        val duration: Duration,
    )

    sealed interface RecruitBlock {

        data object LevyRunning : RecruitBlock

        data object InvalidCount : RecruitBlock
    }

    sealed interface RecruitStatus {

        data object Idle : RecruitStatus

        data object Waiting : RecruitStatus

        data class Refused(val refusal: RecruitRefusal, val unit: UnitKind, val barracksLevel: Int) : RecruitStatus

        data object Unreachable : RecruitStatus
    }

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
        val ratePercent: Double,
        val next: NextArtLine?,
    )

    data class NextArtLine(
        val level: Int,
        val ratePercent: Double,
        val costs: List<CostLine>,
        val duration: Duration,
        val requiredLibraryLevel: Int,
        val isLibraryTooLow: Boolean,
        val block: StudyBlock?,
    )

    sealed interface StudyBlock {

        data object StudyRunning : StudyBlock

        data class LibraryTooLow(val required: Int, val built: Int) : StudyBlock
    }

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

        data class Peasants(val needed: Int, val free: Int) : BlockReason, RecruitBlock

        data class Resources(val shortfalls: List<Shortfall>, val ready: ReadyHour?) :
            BlockReason,
            RecruitBlock,
            StudyBlock
    }

    sealed interface ReadyHour {

        data class InMinutes(val minutes: Int) : ReadyHour

        data object InAnHour : ReadyHour

        data class AtClock(val readyAt: Instant, val remaining: Duration) : ReadyHour
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
