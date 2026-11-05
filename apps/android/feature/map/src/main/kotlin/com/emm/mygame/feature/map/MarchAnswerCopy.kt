package com.emm.mygame.feature.map

import android.content.res.Resources
import com.emm.mygame.core.designsystem.formatQuantity
import com.emm.mygame.core.network.MarchRefusal
import com.emm.mygame.core.network.PlotAddress
import com.emm.mygame.core.network.UnitCount
import com.emm.mygame.core.ui.getIcuString

internal fun Resources.sendAnswerOf(send: MapUiState.SendStatus): String? = when (send) {
    is MapUiState.SendStatus.Refused -> refusalLineOf(send.refusal)
    MapUiState.SendStatus.Unreachable -> getString(R.string.map_unreachable)
    MapUiState.SendStatus.Idle, MapUiState.SendStatus.Waiting -> null
}

internal fun Resources.refusalLineOf(refusal: MarchRefusal): String = when (refusal) {
    is MarchRefusal.NotEnoughUnitsAtHome -> getIcuString(
        R.string.refusal_not_enough_units_at_home,
        "units" to countedOf(UnitCount(refusal.unit, refusal.count)),
        "atHome" to refusal.atHome.toString(),
    )
    is MarchRefusal.StayOutOfRange -> getIcuString(
        R.string.refusal_stay_out_of_range,
        "maxStayHours" to refusal.maxStayHours.toString(),
    )
    is MarchRefusal.FiefCapReached -> getIcuString(R.string.refusal_fief_cap_reached, "cap" to refusal.cap.toString())
    is MarchRefusal.CargoAboveCarry -> getIcuString(
        R.string.refusal_cargo_above_carry,
        "cargo" to formatQuantity(refusal.cargo.toLong()),
        "carry" to formatQuantity(refusal.carry.toLong()),
    )
    MarchRefusal.MarchSlotBusy -> getString(R.string.refusal_march_slot_busy)
    MarchRefusal.MarchTargetOutOfBounds -> getString(R.string.refusal_march_target_out_of_bounds)
    MarchRefusal.PlotHeld -> getString(R.string.refusal_plot_held)
    MarchRefusal.PlotHasCamp -> getString(R.string.refusal_plot_has_camp)
    MarchRefusal.PlotHasNoCamp -> getString(R.string.refusal_plot_has_no_camp)
    MarchRefusal.PlotReserved -> getString(R.string.refusal_plot_reserved)
    MarchRefusal.MarchToOwnPlot -> getString(R.string.refusal_march_to_own_plot)
    MarchRefusal.UnitUnfitForOrder -> getString(R.string.refusal_unit_unfit_for_order)
    MarchRefusal.BlankFiefName -> getString(R.string.refusal_blank_fief_name)
    MarchRefusal.EmptyCargo -> getString(R.string.refusal_empty_cargo)
    MarchRefusal.InsufficientResources -> getString(R.string.map_refusal_insufficient_resources)
    MarchRefusal.FiefNotFound -> getString(R.string.refusal_fief_not_found)
    MarchRefusal.MarchNotFound,
    MarchRefusal.MarchAlreadyReturning,
    MarchRefusal.Unrecognized,
    -> getString(R.string.map_unreachable)
}

internal fun Resources.sentLinesOf(sent: MapUiState.SentMarch): List<String> = when (sent) {
    is MapUiState.SentForage -> listOfNotNull(
        outboundOf(R.string.forage_outbound, sent.units, sent.target),
        returnLineOf(sent.returnIn),
        if (sent.loot.isEmpty()) null else lootLineOf(sent.loot),
    )
    is MapUiState.SentAttack -> listOfNotNull(
        outboundOf(R.string.attack_outbound, sent.units, sent.target),
        campLineOf(sent.camp),
        returnLineOf(sent.returnIn),
        if (sent.loot.isEmpty()) null else lootLineOf(sent.loot),
    )
    is MapUiState.SentFounding -> listOf(
        outboundOf(R.string.founding_outbound, sent.units, sent.target),
        getIcuString(R.string.founding_new_fief, "name" to sent.name),
        arrivalLineOf(sent.arrivalIn),
    )
    is MapUiState.SentTransport -> listOf(
        outboundOf(R.string.transport_outbound, sent.units, sent.target),
        getIcuString(R.string.transport_cargo, "cargo" to quantitiesOf(sent.cargo)),
        arrivalLineOf(sent.arrivalIn),
    )
}

private fun Resources.outboundOf(line: Int, units: List<UnitCount>, target: PlotAddress): String =
    getIcuString(
        line,
        "party" to partyOf(units),
        "province" to target.province.toString(),
        "plot" to target.plot.toString(),
    )
