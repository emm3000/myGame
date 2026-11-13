package com.emm.mygame.feature.placement

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.network.HoldoutCheckRefusal
import com.emm.mygame.core.ui.fixedCopyResource

@Composable
internal fun HoldoutCheckRequestLine(request: HoldoutCheckRequest, modifier: Modifier = Modifier) {
    val line: Int = when (request) {
        HoldoutCheckRequest.Idle, is HoldoutCheckRequest.Waiting -> return
        is HoldoutCheckRequest.Refused -> refusalLineOf(request.refusal)
        HoldoutCheckRequest.Unreachable -> R.string.placement_unreachable
    }
    MyGameInlineAlert(message = fixedCopyResource(line), modifier = modifier)
}

private fun refusalLineOf(refusal: HoldoutCheckRefusal): Int = when (refusal) {
    HoldoutCheckRefusal.NotOpen -> R.string.placement_holdout_refused
    HoldoutCheckRefusal.InvalidRequest -> R.string.placement_holdout_refusal_invalid
}
