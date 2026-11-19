package com.emm.mygame.feature.placement

import androidx.compose.runtime.Composable
import com.emm.mygame.core.designsystem.MyGameDockGo
import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.ui.FillTaskDock
import com.emm.mygame.core.ui.FollowTownDock
import com.emm.mygame.core.ui.TaskDock
import com.emm.mygame.core.ui.TaskDockHook
import com.emm.mygame.core.ui.fixedCopyResource

@Composable
internal fun HoldoutCheckDock(state: HoldoutCheckUiState, onIntent: (HoldoutCheckIntent) -> Unit, hook: TaskDockHook) {
    when (state) {
        HoldoutCheckUiState.Loading, HoldoutCheckUiState.Failed -> Unit
        is HoldoutCheckUiState.Due -> FillTaskDock(hook = hook, dock = dueDock(state, onIntent))
        is HoldoutCheckUiState.Asking -> FillTaskDock(hook = hook, dock = askingDock(state, onIntent))
        HoldoutCheckUiState.NotOpen,
        HoldoutCheckUiState.Answered,
        HoldoutCheckUiState.Skipped,
        -> FollowTownDock(hook = hook)
    }
}

@Composable
private fun dueDock(due: HoldoutCheckUiState.Due, onIntent: (HoldoutCheckIntent) -> Unit): TaskDock {
    val waiting: HoldoutCheckAction? = (due.request as? HoldoutCheckRequest.Waiting)?.action
    return TaskDock(
        step = fixedLabel(R.string.placement_band, "band" to due.band.number.toString()),
        go = MyGameDockGo(
            label = fixedLabel(R.string.placement_holdout_start),
            isBusy = waiting == HoldoutCheckAction.Begin,
            busyDescription = fixedCopyResource(R.string.placement_sending),
            onClick = { onIntent(HoldoutCheckIntent.StartTapped) },
        ),
    )
}

@Composable
private fun askingDock(asking: HoldoutCheckUiState.Asking, onIntent: (HoldoutCheckIntent) -> Unit): TaskDock =
    TaskDock(
        step = askingStep(asking),
        go = askingGo(asking, onIntent),
        notice = { HoldoutCheckRequestLine(request = asking.request) },
    )

@Composable
private fun askingStep(asking: HoldoutCheckUiState.Asking): MyGameLabel {
    if (asking.shown == null) return fixedLabel(R.string.placement_holdout_title)
    return progressLabel(shownIndex = asking.shownIndex, total = asking.items.size)
}

@Composable
private fun askingGo(asking: HoldoutCheckUiState.Asking, onIntent: (HoldoutCheckIntent) -> Unit): MyGameDockGo {
    val isUnchosen: Boolean = asking.shown != null && asking.chosenForShown == null
    val blockedReason: String? = if (isUnchosen) fixedCopyResource(R.string.placement_choose) else null
    val sending: String = fixedCopyResource(R.string.placement_sending)
    if (!asking.isLastShown) {
        return MyGameDockGo(
            label = fixedLabel(R.string.placement_next),
            isBusy = false,
            busyDescription = sending,
            onClick = { onIntent(HoldoutCheckIntent.NextTapped) },
            blockedReason = blockedReason,
        )
    }
    return MyGameDockGo(
        label = fixedLabel(R.string.placement_holdout_send),
        isBusy = asking.request is HoldoutCheckRequest.Waiting,
        busyDescription = sending,
        onClick = { onIntent(HoldoutCheckIntent.AnswersSent) },
        blockedReason = blockedReason,
    )
}
