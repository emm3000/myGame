package com.emm.mygame.feature.town

import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownFoundRefusal
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
        val slot: SlotLine,
        val waitingList: List<WaitingLine>,
        val places: List<PlaceCard>,
        val start: StartStatus,
        val stop: StopStatus,
    ) : TownUiState

    sealed interface NamingStatus {

        data object Idle : NamingStatus

        data object Submitting : NamingStatus

        data class Refused(val refusal: TownFoundRefusal) : NamingStatus

        data object Unreachable : NamingStatus
    }

    data class StockLine(val kind: TownResourceKind, val amount: Long, val capacity: Long, val ratePerHour: Long) {

        val isFull: Boolean
            get() = amount >= capacity
    }

    data class PeopleLine(val free: Int, val atWork: Int)

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
        val next: NextLevelLine?,
        val block: BlockReason?,
    )

    data class NextLevelLine(val level: Int, val costs: List<CostLine>, val duration: Duration, val people: Int)

    data class CostLine(val kind: TownResourceKind, val amount: Long, val isShort: Boolean)

    data class Shortfall(val kind: TownResourceKind, val amount: Long)

    sealed interface BlockReason {

        data class WaitingListFull(val cap: Int) : BlockReason

        data class PeopleShort(val needed: Int, val free: Int) : BlockReason

        data class Resources(val shortfalls: List<Shortfall>) : BlockReason
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
}
