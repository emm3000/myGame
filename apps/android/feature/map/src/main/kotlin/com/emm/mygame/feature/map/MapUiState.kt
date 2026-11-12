package com.emm.mygame.feature.map

import com.emm.mygame.core.network.Terrain
import com.emm.mygame.core.network.TownJobRefusal
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSite
import com.emm.mygame.core.network.TownSnapshot
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
        val form: JobForm?,
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
    }

    data class JobForm(
        val site: Int,
        val workers: String,
        val trucks: String,
        val hours: String,
        val workersAtHome: Int,
        val trucksAtHome: Int,
        val block: JobBlock?,
        val quote: PayQuote?,
    )

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
        val site: TownSite,
        val workers: Int,
        val trucks: Int,
        val phase: TownSnapshot.JobPhase,
        val remaining: Duration,
        val finishesAt: Instant,
        val pay: List<PayLine>,
        val canCallBack: Boolean,
    )

    data class PayLine(val resource: TownResourceKind, val amount: Long)
}
