package com.emm.mygame.feature.placement

import androidx.compose.runtime.Composable
import com.emm.mygame.core.designsystem.control.MyGameInlineAlert
import com.emm.mygame.core.designsystem.navigation.MyGameWayOn
import com.emm.mygame.core.designsystem.text.MyGameLabel
import com.emm.mygame.core.ui.fixedCopyResource
import com.emm.mygame.core.ui.fixedLabel

@Composable
internal fun PlacementWayOn(state: PlacementUiState, onIntent: (PlacementIntent) -> Unit, onDone: () -> Unit) {
    when (state) {
        PlacementUiState.Loading, PlacementUiState.Failed -> Unit
        is PlacementUiState.Offered -> OfferedWayOn(offered = state, onIntent = onIntent)
        is PlacementUiState.Asking -> AskingWayOn(asking = state, onIntent = onIntent)
        is PlacementUiState.Closed -> MyGameWayOn(
            label = fixedLabel(R.string.placement_done),
            isBusy = false,
            busyDescription = fixedLabel(R.string.placement_sending),
            onClick = onDone,
        )
    }
}

@Composable
private fun OfferedWayOn(offered: PlacementUiState.Offered, onIntent: (PlacementIntent) -> Unit) {
    val waiting: PlacementAction? = (offered.request as? PlacementRequest.Waiting)?.action
    MyGameWayOn(
        label = fixedLabel(R.string.placement_start),
        isBusy = waiting == PlacementAction.Begin,
        busyDescription = fixedLabel(R.string.placement_sending),
        onClick = { onIntent(PlacementIntent.StartTapped) },
    )
}

@Composable
private fun AskingWayOn(asking: PlacementUiState.Asking, onIntent: (PlacementIntent) -> Unit) {
    val blockedReason: MyGameLabel? =
        if (asking.chosenForShown == null) fixedLabel(R.string.placement_choose) else null
    MyGameWayOn(
        label = if (asking.isLastShown) {
            fixedLabel(R.string.placement_send_band, "band" to asking.band.number.toString())
        } else {
            fixedLabel(R.string.placement_next)
        },
        isBusy = asking.isLastShown && asking.request is PlacementRequest.Waiting,
        busyDescription = fixedLabel(R.string.placement_sending),
        onClick = { onIntent(if (asking.isLastShown) PlacementIntent.BandSent else PlacementIntent.NextTapped) },
        blockedReason = blockedReason,
        verdict = {
            if (asking.request == PlacementRequest.Unreachable) {
                MyGameInlineAlert(message = fixedCopyResource(R.string.placement_unreachable))
            }
        },
    )
}
