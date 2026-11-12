package com.emm.mygame.feature.town

import com.emm.mygame.core.network.NextStepCard
import com.emm.mygame.core.network.SeasonKind
import com.emm.mygame.core.network.TipKind
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownFoundRefusal
import com.emm.mygame.core.network.TownGoal
import com.emm.mygame.core.network.TownHireKind
import com.emm.mygame.core.network.TownHiringRefusal
import com.emm.mygame.core.network.TownLabel
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownWorkRefusal
import kotlin.time.Duration
import kotlin.time.Instant

sealed interface TownUiState {

    data object Loading : TownUiState

    data object Failed : TownUiState

    data object SigningOut : TownUiState

    data class Naming(val name: String, val status: NamingStatus) : TownUiState

    data class Content(
        val name: String,
        val label: TownLabel,
        val stocks: List<StockLine>,
        val people: PeopleLine,
        val season: SeasonLine?,
        val slot: SlotLine,
        val waitingList: List<WaitingLine>,
        val places: List<PlaceCard>,
        val nextStep: NextStepCard,
        val nextStepTime: NextStepTime?,
        val goal: TownGoal?,
        val tip: TipKind?,
        val start: StartStatus,
        val stop: StopStatus,
        val office: OfficeLine,
    ) : TownUiState

    sealed interface NamingStatus {

        data object Idle : NamingStatus

        data object Submitting : NamingStatus

        data class Refused(val refusal: TownFoundRefusal) : NamingStatus

        data object Unreachable : NamingStatus
    }

    data class StockLine(
        val kind: TownResourceKind,
        val amount: Long,
        val capacity: Long,
        val ratePerHour: Long,
        val skillLevel: Int,
        val fill: FillTime?,
    ) {

        val isFull: Boolean
            get() = amount >= capacity
    }

    data class FillTime(val remaining: Duration, val fullAt: Instant)

    data class NextStepTime(val remaining: Duration, val finishesAt: Instant)

    data class PeopleLine(val free: Int, val atWork: Int)

    data class SeasonLine(val kind: SeasonKind, val year: Int, val remaining: Duration)

    sealed interface SlotLine {

        data object Idle : SlotLine

        data class Busy(
            val building: TownBuildingKind,
            val level: Int,
            val remaining: Duration,
            val total: Duration,
            val finishesAt: Instant,
        ) : SlotLine

        data class Done(val building: TownBuildingKind, val level: Int) : SlotLine
    }

    data class WaitingLine(
        val building: TownBuildingKind,
        val level: Int,
        val remaining: Duration,
        val finishesAt: Instant,
    )

    data class WorkTarget(val building: TownBuildingKind, val level: Int)

    data class PlaceCard(
        val kind: TownBuildingKind,
        val level: Int,
        val raisedFrom: Int?,
        val isInWork: Boolean,
        val next: NextLevelLine?,
        val block: BlockReason?,
    )

    data class NextLevelLine(val level: Int, val costs: List<CostLine>, val duration: Duration, val people: Int)

    data class CostLine(val kind: TownResourceKind, val amount: Long, val isShort: Boolean)

    data class Shortfall(val kind: TownResourceKind, val amount: Long)

    data class ReadyTime(val remaining: Duration, val readyAt: Instant)

    sealed interface BlockReason {

        data class WaitingListFull(val cap: Int) : BlockReason

        data class PeopleShort(val needed: Int, val free: Int) : BlockReason

        data class Resources(val shortfalls: List<Shortfall>, val ready: ReadyTime?) : BlockReason
    }

    sealed interface StartStatus {

        data object Idle : StartStatus

        data class Waiting(val building: TownBuildingKind) : StartStatus

        data class Refused(val building: TownBuildingKind, val refusal: TownWorkRefusal) : StartStatus

        data class Unreachable(val building: TownBuildingKind) : StartStatus
    }

    sealed interface StopStatus {

        data object Idle : StopStatus

        data class Waiting(val target: WorkTarget) : StopStatus

        data class Refused(val target: WorkTarget, val refusal: TownWorkRefusal) : StopStatus

        data class Unreachable(val target: WorkTarget) : StopStatus
    }

    data class OfficeLine(
        val hiring: HiringLine,
        val hires: List<HireCard>,
        val place: HireStatus,
        val stop: HireStopStatus,
    )

    sealed interface HiringLine {

        data object Idle : HiringLine

        data class Busy(
            val target: HiringTarget,
            val count: Int,
            val delivered: Int,
            val remaining: Duration,
            val total: Duration,
            val finishesAt: Instant,
        ) : HiringLine

        data class Done(val hire: TownHireKind, val count: Int, val delivered: Int) : HiringLine
    }

    data class HiringTarget(val hire: TownHireKind, val startedAt: Instant)

    data class HireCard(val kind: TownHireKind, val team: Int, val requiredOfficeLevel: Int, val form: HireForm?)

    data class HireForm(val entry: String, val isEntryDisabled: Boolean, val offer: HireOffer?, val block: HireBlock?)

    data class HireOffer(
        val count: Int,
        val costs: List<CostLine>,
        val people: Long,
        val isPeopleShort: Boolean,
        val duration: Duration,
    )

    sealed interface HireBlock {

        data object CountNeeded : HireBlock

        data object Busy : HireBlock

        data class PeopleShort(val needed: Long, val free: Int) : HireBlock

        data class Resources(val shortfalls: List<Shortfall>, val ready: ReadyTime?) : HireBlock
    }

    sealed interface HireStatus {

        data object Idle : HireStatus

        data class Waiting(val hire: TownHireKind) : HireStatus

        data class Refused(val hire: TownHireKind, val refusal: TownHiringRefusal) : HireStatus

        data class Unreachable(val hire: TownHireKind) : HireStatus
    }

    sealed interface HireStopStatus {

        data object Idle : HireStopStatus

        data object Waiting : HireStopStatus

        data class Refused(val refusal: TownHiringRefusal) : HireStopStatus

        data object Unreachable : HireStopStatus
    }
}
