package com.emm.mygame.feature.map

import com.emm.mygame.core.network.MarchRefusal
import com.emm.mygame.core.network.PlotAddress
import com.emm.mygame.core.network.ProvinceMap
import com.emm.mygame.core.network.ResourceQuantity
import com.emm.mygame.core.network.UnitCount
import com.emm.mygame.core.network.UnitKind
import kotlin.time.Duration

sealed interface MapUiState {

    data object Loading : MapUiState

    data class Failed(val request: ProvinceRequest) : MapUiState

    data object ProvinceNotFound : MapUiState

    data class Content(
        val map: ProvinceMap,
        val jumpEntry: String,
        val forageablePlots: List<Int>,
        val form: ForageForm?,
        val sent: SentForage?,
    ) : MapUiState {

        val hasPrevious: Boolean
            get() = map.province > 1

        val hasNext: Boolean
            get() = map.province < map.lastProvince
    }

    data class ForageForm(
        val target: PlotAddress,
        val atHome: List<UnitCount>,
        val entries: List<PartyEntry>,
        val hoursEntry: String,
        val maxStayHours: Int,
        val isFieldLocked: Boolean,
        val preview: ForagePreview?,
        val block: ForageBlock?,
        val send: SendStatus,
    )

    data class PartyEntry(val unit: UnitKind, val entry: String)

    data class ForagePreview(val road: Duration, val returnIn: Duration, val loot: List<ResourceQuantity>)

    sealed interface ForageBlock {

        data object MarchAway : ForageBlock

        data object InvalidCount : ForageBlock

        data class InvalidHours(val maxStayHours: Int) : ForageBlock

        data object EmptyParty : ForageBlock

        data class NotEnoughAtHome(val unit: UnitKind, val needed: Int, val atHome: Int) : ForageBlock
    }

    sealed interface SendStatus {

        data object Idle : SendStatus

        data object Waiting : SendStatus

        data class Refused(val refusal: MarchRefusal) : SendStatus

        data object Unreachable : SendStatus
    }

    data class SentForage(
        val target: PlotAddress,
        val units: List<UnitCount>,
        val returnIn: Duration,
        val loot: List<ResourceQuantity>,
    )
}
