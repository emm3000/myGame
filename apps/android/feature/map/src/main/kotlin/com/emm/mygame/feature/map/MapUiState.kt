package com.emm.mygame.feature.map

import com.emm.mygame.core.network.MarchCamp
import com.emm.mygame.core.network.MarchRefusal
import com.emm.mygame.core.network.PlotAddress
import com.emm.mygame.core.network.ProvinceMap
import com.emm.mygame.core.network.ResourceKind
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
        val offers: List<PlotOffer>,
        val form: MarchForm?,
        val sent: SentMarch?,
    ) : MapUiState {

        val hasPrevious: Boolean
            get() = map.province > 1

        val hasNext: Boolean
            get() = map.province < map.lastProvince

        fun offersOn(plot: Int): List<OfferedOrder> =
            offers.filter { offer: PlotOffer -> offer.plot == plot }.map { offer: PlotOffer -> offer.order }
    }

    data class PlotOffer(val plot: Int, val order: OfferedOrder)

    enum class OfferedOrder {
        Forage,
        Attack,
        Found,
        Transport,
    }

    sealed interface MarchForm {

        val target: PlotAddress

        val isFieldLocked: Boolean

        val block: MarchBlock?

        val send: SendStatus
    }

    data class ForageForm(
        override val target: PlotAddress,
        val atHome: List<UnitCount>,
        val entries: List<PartyEntry>,
        val hoursEntry: String,
        val maxStayHours: Int,
        override val isFieldLocked: Boolean,
        val preview: ForagePreview?,
        override val block: MarchBlock?,
        override val send: SendStatus,
    ) : MarchForm

    data class AttackForm(
        override val target: PlotAddress,
        val atHome: List<UnitCount>,
        val entries: List<PartyEntry>,
        override val isFieldLocked: Boolean,
        val preview: AttackPreview?,
        override val block: MarchBlock?,
        override val send: SendStatus,
    ) : MarchForm

    data class FoundingForm(
        override val target: PlotAddress,
        val settlersAtHome: Int,
        val nameEntry: String,
        override val isFieldLocked: Boolean,
        val preview: FoundingPreview?,
        override val block: MarchBlock?,
        override val send: SendStatus,
    ) : MarchForm

    data class TransportForm(
        override val target: PlotAddress,
        val atHome: List<UnitCount>,
        val entries: List<PartyEntry>,
        val cargoEntries: List<CargoEntry>,
        override val isFieldLocked: Boolean,
        val preview: TransportPreview?,
        override val block: MarchBlock?,
        override val send: SendStatus,
    ) : MarchForm

    data class PartyEntry(val unit: UnitKind, val entry: String)

    data class CargoEntry(val kind: ResourceKind, val entry: String)

    data class ForagePreview(val road: Duration, val returnIn: Duration, val loot: List<ResourceQuantity>)

    data class AttackPreview(
        val road: Duration,
        val returnIn: Duration,
        val camp: MarchCamp,
        val isWon: Boolean,
        val unitsLost: List<UnitCount>,
        val campLost: Int,
        val survivors: List<UnitCount>,
        val loot: List<ResourceQuantity>,
    )

    data class FoundingPreview(val road: Duration)

    data class TransportPreview(val cargo: Long, val carry: Long, val road: Duration?)

    sealed interface MarchBlock {

        data object MarchAway : MarchBlock

        data object InvalidCount : MarchBlock

        data class InvalidHours(val maxStayHours: Int) : MarchBlock

        data object EmptyParty : MarchBlock

        data class NotEnoughAtHome(val unit: UnitKind, val needed: Int, val atHome: Int) : MarchBlock

        data object BlankName : MarchBlock

        data object EmptyCargo : MarchBlock

        data class CargoAboveCarry(val cargo: Long, val carry: Long) : MarchBlock

        data class Shortfalls(val missing: List<ResourceQuantity>) : MarchBlock
    }

    sealed interface SendStatus {

        data object Idle : SendStatus

        data object Waiting : SendStatus

        data class Refused(val refusal: MarchRefusal) : SendStatus

        data class RefusedWithApiLine(val line: String) : SendStatus

        data object Unreachable : SendStatus
    }

    sealed interface SentMarch {

        val target: PlotAddress
    }

    data class SentForage(
        override val target: PlotAddress,
        val units: List<UnitCount>,
        val returnIn: Duration,
        val loot: List<ResourceQuantity>,
    ) : SentMarch

    data class SentAttack(
        override val target: PlotAddress,
        val units: List<UnitCount>,
        val camp: MarchCamp,
        val returnIn: Duration,
        val loot: List<ResourceQuantity>,
    ) : SentMarch

    data class SentFounding(
        override val target: PlotAddress,
        val units: List<UnitCount>,
        val name: String,
        val arrivalIn: Duration,
    ) : SentMarch

    data class SentTransport(
        override val target: PlotAddress,
        val units: List<UnitCount>,
        val cargo: List<ResourceQuantity>,
        val arrivalIn: Duration,
    ) : SentMarch
}
