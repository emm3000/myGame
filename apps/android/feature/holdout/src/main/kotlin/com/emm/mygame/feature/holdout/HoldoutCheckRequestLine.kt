package com.emm.mygame.feature.holdout

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.model.holdout.HoldoutCheckRefusal
import com.emm.mygame.core.ui.fixedCopyResource

@Composable
internal fun HoldoutCheckRequestLine(request: HoldoutCheckRequest, modifier: Modifier = Modifier) {
    val line: Int = when (request) {
        HoldoutCheckRequest.Idle, is HoldoutCheckRequest.Waiting -> return
        is HoldoutCheckRequest.Refused -> refusalLineOf(request.action, request.refusal)
        HoldoutCheckRequest.Unreachable -> R.string.holdout_unreachable
    }
    MyGameInlineAlert(message = fixedCopyResource(line), modifier = modifier)
}

private fun refusalLineOf(action: HoldoutCheckAction, refusal: HoldoutCheckRefusal): Int = when (refusal) {
    HoldoutCheckRefusal.NotOpen -> R.string.holdout_refused
    HoldoutCheckRefusal.InvalidRequest -> invalidRequestLineOf(action)
}

private fun invalidRequestLineOf(action: HoldoutCheckAction): Int = when (action) {
    HoldoutCheckAction.Begin, HoldoutCheckAction.Skip -> R.string.holdout_refused
    HoldoutCheckAction.Answers -> R.string.holdout_refusal_invalid
}
