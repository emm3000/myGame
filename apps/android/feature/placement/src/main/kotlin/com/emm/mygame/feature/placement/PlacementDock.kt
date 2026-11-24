package com.emm.mygame.feature.placement

import androidx.compose.runtime.Composable
import com.emm.mygame.core.designsystem.MyGameDockGo
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.ui.FillTaskDock
import com.emm.mygame.core.ui.FollowTownDock
import com.emm.mygame.core.ui.TaskDock
import com.emm.mygame.core.ui.TaskDockHook
import com.emm.mygame.core.ui.fixedCopyResource
import com.emm.mygame.core.ui.fixedLabel

@Composable
internal fun PlacementDock(state: PlacementUiState, onIntent: (PlacementIntent) -> Unit, hook: TaskDockHook) {
    when (state) {
        PlacementUiState.Loading, PlacementUiState.Failed -> Unit
        is PlacementUiState.Offered -> FillTaskDock(hook = hook, dock = offeredDock(state, onIntent))
        is PlacementUiState.Asking -> FillTaskDock(hook = hook, dock = askingDock(state, onIntent))
        is PlacementUiState.Closed -> FollowTownDock(hook = hook)
    }
}

@Composable
private fun offeredDock(offered: PlacementUiState.Offered, onIntent: (PlacementIntent) -> Unit): TaskDock {
    val waiting: PlacementAction? = (offered.request as? PlacementRequest.Waiting)?.action
    return TaskDock(
        step = fixedLabel(R.string.placement_offer_line),
        go = MyGameDockGo(
            label = fixedLabel(R.string.placement_start),
            isBusy = waiting == PlacementAction.Begin,
            busyDescription = fixedCopyResource(R.string.placement_sending),
            onClick = { onIntent(PlacementIntent.StartTapped) },
        ),
    )
}

@Composable
private fun askingDock(asking: PlacementUiState.Asking, onIntent: (PlacementIntent) -> Unit): TaskDock = TaskDock(
    step = progressLabel(shownIndex = asking.shownIndex, total = asking.items.size),
    go = askingGo(asking, onIntent),
    notice = {
        if (asking.request == PlacementRequest.Unreachable) {
            MyGameInlineAlert(message = fixedCopyResource(R.string.placement_unreachable))
        }
    },
)

@Composable
private fun askingGo(asking: PlacementUiState.Asking, onIntent: (PlacementIntent) -> Unit): MyGameDockGo {
    val blockedReason: String? =
        if (asking.chosenForShown == null) fixedCopyResource(R.string.placement_choose) else null
    val sending: String = fixedCopyResource(R.string.placement_sending)
    if (!asking.isLastShown) {
        return MyGameDockGo(
            label = fixedLabel(R.string.placement_next),
            isBusy = false,
            busyDescription = sending,
            onClick = { onIntent(PlacementIntent.NextTapped) },
            blockedReason = blockedReason,
        )
    }
    return MyGameDockGo(
        label = fixedLabel(R.string.placement_send_band, "band" to asking.band.number.toString()),
        isBusy = asking.request is PlacementRequest.Waiting,
        busyDescription = sending,
        onClick = { onIntent(PlacementIntent.BandSent) },
        blockedReason = blockedReason,
    )
}
