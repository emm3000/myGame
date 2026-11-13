package com.emm.mygame.feature.placement

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.ui.fixedCopyResource

@Composable
internal fun HoldoutCheckRequestLine(request: HoldoutCheckRequest, modifier: Modifier = Modifier) {
    val line: Int = when (request) {
        HoldoutCheckRequest.Idle, is HoldoutCheckRequest.Waiting -> return
        HoldoutCheckRequest.Refused -> R.string.placement_holdout_refused
        HoldoutCheckRequest.Unreachable -> R.string.placement_unreachable
    }
    MyGameInlineAlert(message = fixedCopyResource(line), modifier = modifier)
}
