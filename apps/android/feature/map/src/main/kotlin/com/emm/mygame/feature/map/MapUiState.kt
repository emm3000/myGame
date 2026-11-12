package com.emm.mygame.feature.map

import com.emm.mygame.core.network.Terrain
import com.emm.mygame.core.network.TownJobRefusal
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSite
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.network.WasteSize
import kotlin.time.Duration
import kotlin.time.Instant

sealed interface MapUiState {

    data object Loading : MapUiState

    data object Failed : MapUiState

    data object AreaNotFound : MapUiState

    data class Content(
        val areaLine: AreaLine,
        val previousArea: Int?,
        val nextArea: Int?,
        val sites: List<SiteRow>,
        val form: SiteForm?,
        val send: SendRequest,
        val jobOut: JobOut?,
        val callBack: CallBackRequest,
    ) : MapUiState

    data class AreaLine(val area: Int, val terrain: Terrain)

    sealed interface SiteRow {

        val site: Int

        data class Free(override val site: Int) : SiteRow

        data class Town(override val site: Int, val name: String) : SiteRow

        data class Own(override val site: Int, val name: String) : SiteRow

        data class Waste(override val site: Int, val size: WasteSize, val waste: Int) : SiteRow
    }

    sealed interface SiteForm {

        val site: Int

        val workers: String

        val trucks: String

        val workersAtHome: Int

        val trucksAtHome: Int

        val block: JobBlock?
    }

    data class JobForm(
        override val site: Int,
        override val workers: String,
        override val trucks: String,
        val hours: String,
        override val workersAtHome: Int,
        override val trucksAtHome: Int,
        override val block: JobBlock?,
        val quote: PayQuote?,
    ) : SiteForm

    data class CleanUpForm(
        override val site: Int,
        override val workers: String,
        override val trucks: String,
        override val workersAtHome: Int,
        override val trucksAtHome: Int,
        override val block: JobBlock?,
        val quote: CleanUpQuote?,
    ) : SiteForm

    sealed interface CleanUpQuote {

        data object Asking : CleanUpQuote

        data class Quoted(val strength: Int, val waste: Int, val pay: List<PayLine>, val isShort: Boolean) :
            CleanUpQuote

        data class Refused(val refusal: TownJobRefusal) : CleanUpQuote

        data object Unreachable : CleanUpQuote
    }

    sealed interface PayQuote {

        data object Asking : PayQuote

        data class Quoted(val pay: List<PayLine>) : PayQuote

        data class Refused(val refusal: TownJobRefusal) : PayQuote

        data object Unreachable : PayQuote
    }

    sealed interface JobBlock {

        data object CountNeeded : JobBlock

        data object InvalidTeam : JobBlock

        data object HoursNeeded : JobBlock
    }

    sealed interface SendRequest {

        data object Idle : SendRequest

        data object Waiting : SendRequest

        data class Refused(val site: Int, val refusal: TownJobRefusal) : SendRequest

        data class Unreachable(val site: Int) : SendRequest
    }

    sealed interface CallBackRequest {

        data object Idle : CallBackRequest

        data object Waiting : CallBackRequest

        data class Refused(val refusal: TownJobRefusal) : CallBackRequest

        data object Unreachable : CallBackRequest
    }

    data class JobOut(
        val kind: JobKind,
        val site: TownSite,
        val workers: Int,
        val trucks: Int,
        val phase: TownSnapshot.JobPhase,
        val remaining: Duration,
        val finishesAt: Instant,
        val pay: List<PayLine>,
        val canCallBack: Boolean,
    )

    sealed interface JobKind {

        data object Job : JobKind

        data class CleanUp(val waste: Int, val outcome: CleanUpOutcome?) : JobKind
    }

    enum class CleanUpOutcome {
        Short,
        Cleaned,
        NotCleaned,
    }

    data class PayLine(val resource: TownResourceKind, val amount: Long)
}
