package com.emm.mygame.feature.town

import com.emm.mygame.core.model.town.SeasonKind
import com.emm.mygame.core.model.town.TownFoundRefusal
import com.emm.mygame.core.model.town.TownLabel
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.building.NeededWordKind
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.building.TownWorkRefusal
import com.emm.mygame.core.model.town.guidance.NextStepText
import com.emm.mygame.core.model.town.guidance.TipKind
import com.emm.mygame.core.model.town.guidance.TownGoal
import com.emm.mygame.core.model.town.hiring.TownHireKind
import com.emm.mygame.core.model.town.hiring.TownHiringRefusal
import com.emm.mygame.core.model.town.school.TownLessonRefusal
import kotlin.time.Duration
import kotlin.time.Instant

sealed interface TownUiState {

    val isDockWithheld: Boolean
        get() = when (this) {
            is Naming -> true
            is SigningOut -> isLeavingNaming
            Loading, Failed, is Content -> false
        }

    data object Loading : TownUiState

    data object Failed : TownUiState

    data class SigningOut(val isLeavingNaming: Boolean) : TownUiState

    data class Naming(val name: String, val status: NamingStatus) : TownUiState

    data class Content(
        val name: String,
        val label: TownLabel,
        val stocks: List<StockLine>,
        val people: PeopleLine,
        val words: WordsLine,
        val season: SeasonLine?,
        val buildMark: DurationMark?,
        val slot: SlotLine,
        val waitingList: List<WaitingLine>,
        val places: List<PlaceCard>,
        val nextStepPlace: TownBuildingKind,
        val goal: TownGoal?,
        val caughtUpGoal: TownGoal?,
        val newestText: NextStepText?,
        val tip: TipKind?,
        val start: StartStatus,
        val stop: StopStatus,
        val hiring: Hiring,
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

    data class PeopleLine(val free: Int, val atWork: Int)

    data class WordsLine(val stable: Int, val retained: Int)

    data class SeasonLine(
        val kind: SeasonKind,
        val year: Int,
        val remaining: Duration,
        val productionMarks: List<ProductionMark>,
    )

    data class ProductionMark(val resource: TownResourceKind, val percent: Int)

    data class DurationMark(val season: SeasonKind, val percent: Int)

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

    data class NextLevelLine(
        val level: Int,
        val costs: List<CostLine>,
        val duration: Duration,
        val people: Int,
        val wordsNeeded: WordNeedLine?,
    )

    data class WordNeedLine(val needed: Int, val held: Int, val standing: NeededWordKind)

    data class CostLine(val kind: TownResourceKind, val amount: Long, val isShort: Boolean)

    data class Shortfall(val kind: TownResourceKind, val amount: Long)

    data class ReadyTime(val remaining: Duration, val readyAt: Instant)

    sealed interface BlockReason {

        data class WaitingListFull(val cap: Int) : BlockReason

        data class PeopleShort(val needed: Int, val free: Int) : BlockReason

        data class Resources(val shortfalls: List<Shortfall>, val ready: ReadyTime?) : BlockReason
    }

    sealed interface LessonStartStatus {

        data object Idle : LessonStartStatus

        data object Waiting : LessonStartStatus

        data class Refused(val refusal: TownLessonRefusal) : LessonStartStatus

        data object Unreachable : LessonStartStatus
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

    data class Hiring(
        val order: HiringLine,
        val hires: List<HiringCard>,
        val hireMark: DurationMark?,
        val place: HiringStatus,
        val stop: HiringStopStatus,
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

    data class HiringCard(val kind: TownHireKind, val team: Int, val requiredOfficeLevel: Int, val form: HiringForm?)

    data class HiringForm(
        val entry: String,
        val isEntryDisabled: Boolean,
        val offer: HiringOffer?,
        val block: HiringBlock?,
    )

    data class HiringOffer(
        val count: Int,
        val costs: List<CostLine>,
        val people: Long,
        val isPeopleShort: Boolean,
        val duration: Duration,
    )

    sealed interface HiringBlock {

        data object CountNeeded : HiringBlock

        data object Busy : HiringBlock

        data class PeopleShort(val needed: Long, val free: Int) : HiringBlock

        data class Resources(val shortfalls: List<Shortfall>, val ready: ReadyTime?) : HiringBlock
    }

    sealed interface HiringStatus {

        data object Idle : HiringStatus

        data class Waiting(val hire: TownHireKind) : HiringStatus

        data class Refused(val hire: TownHireKind, val refusal: TownHiringRefusal) : HiringStatus

        data class Unreachable(val hire: TownHireKind) : HiringStatus
    }

    sealed interface HiringStopStatus {

        data object Idle : HiringStopStatus

        data object Waiting : HiringStopStatus

        data class Refused(val refusal: TownHiringRefusal) : HiringStopStatus

        data object Unreachable : HiringStopStatus
    }
}
