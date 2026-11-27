package com.emm.mygame.feature.holdout

import androidx.compose.runtime.Composable
import com.emm.mygame.core.designsystem.navigation.MyGameWayOn
import com.emm.mygame.core.designsystem.text.MyGameLabel
import com.emm.mygame.core.ui.fixedLabel

@Composable
internal fun HoldoutCheckWayOn(state: HoldoutCheckUiState, onIntent: (HoldoutCheckIntent) -> Unit, onDone: () -> Unit) {
    when (state) {
        HoldoutCheckUiState.Loading, HoldoutCheckUiState.Failed -> Unit
        is HoldoutCheckUiState.Due -> DueWayOn(due = state, onIntent = onIntent)
        is HoldoutCheckUiState.Asking -> AskingWayOn(asking = state, onIntent = onIntent)
        HoldoutCheckUiState.NotOpen,
        HoldoutCheckUiState.Answered,
        HoldoutCheckUiState.Skipped,
        -> MyGameWayOn(
            label = fixedLabel(R.string.holdout_continue),
            isBusy = false,
            busyDescription = fixedLabel(R.string.holdout_sending),
            onClick = onDone,
        )
    }
}

@Composable
private fun DueWayOn(due: HoldoutCheckUiState.Due, onIntent: (HoldoutCheckIntent) -> Unit) {
    val waiting: HoldoutCheckAction? = (due.request as? HoldoutCheckRequest.Waiting)?.action
    MyGameWayOn(
        label = fixedLabel(R.string.holdout_start),
        isBusy = waiting == HoldoutCheckAction.Begin,
        busyDescription = fixedLabel(R.string.holdout_sending),
        onClick = { onIntent(HoldoutCheckIntent.StartTapped) },
        verdict = {
            if (!due.request.isSkipVerdict) HoldoutCheckRequestLine(request = due.request)
        },
    )
}

@Composable
private fun AskingWayOn(asking: HoldoutCheckUiState.Asking, onIntent: (HoldoutCheckIntent) -> Unit) {
    val isUnchosen: Boolean = asking.shown != null && asking.chosenForShown == null
    val blockedReason: MyGameLabel? = if (isUnchosen) fixedLabel(R.string.holdout_choose) else null
    val tapped: HoldoutCheckIntent =
        if (asking.isLastShown) HoldoutCheckIntent.AnswersSent else HoldoutCheckIntent.NextTapped
    MyGameWayOn(
        label = if (asking.isLastShown) fixedLabel(R.string.holdout_send) else fixedLabel(R.string.holdout_next),
        isBusy = asking.isLastShown && asking.request is HoldoutCheckRequest.Waiting,
        busyDescription = fixedLabel(R.string.holdout_sending),
        onClick = { onIntent(tapped) },
        blockedReason = blockedReason,
        verdict = { HoldoutCheckRequestLine(request = asking.request) },
    )
}
