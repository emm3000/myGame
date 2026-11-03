package com.emm.mygame.feature.map

import com.emm.mygame.core.network.FiefSnapshot
import com.emm.mygame.core.network.MarchRefusal
import com.emm.mygame.core.network.MarchResult
import com.emm.mygame.core.network.PlotAddress
import com.emm.mygame.core.network.ResourceKind
import com.emm.mygame.core.network.Terrain

internal fun FiefSnapshot.firstChoiceOn(target: PlotAddress, order: ChosenOrder, proposedName: String): MarchChoice =
    MarchChoice(
        target = target,
        order = order,
        entries = firstEntries(),
        hoursEntry = FIRST_HOURS,
        nameEntry = proposedName,
        cargoEntries = ResourceKind.entries.associateWith { UNLOADED },
        send = MapUiState.SendStatus.Idle,
    )

internal fun FiefSnapshot.formOf(choice: MarchChoice, terrain: Terrain): MapUiState.MarchForm =
    when (val order: ChosenOrder = choice.order) {
        ChosenOrder.Forage -> forageFormOf(choice, terrain)
        is ChosenOrder.Attack -> attackFormOf(choice, order.camp, terrain)
        ChosenOrder.Found -> foundingFormOf(choice)
        is ChosenOrder.Transport -> transportFormOf(choice)
    }

internal fun MarchResult.Refused.sendStatus(): MapUiState.SendStatus = if (refusal in apiLinedRefusals) {
    MapUiState.SendStatus.RefusedWithApiLine(message)
} else {
    MapUiState.SendStatus.Refused(refusal)
}

private val apiLinedRefusals: Set<MarchRefusal> = setOf(
    MarchRefusal.NotEnoughUnitsAtHome,
    MarchRefusal.StayOutOfRange,
    MarchRefusal.FiefCapReached,
    MarchRefusal.CargoAboveCarry,
)

private const val FIRST_HOURS: String = "1"

private const val UNLOADED: String = "0"
