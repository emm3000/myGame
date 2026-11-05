package com.emm.mygame.feature.fief

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.clearAndSetSemantics
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.ui.icuStringResource
import java.time.ZoneId

internal data class BlockedReason(val reason: String, val ready: String?, val description: String)

@Composable
internal fun blockedReasonOf(reason: String, ready: FiefUiState.ReadyHour?): BlockedReason {
    val readyLine: String? = ready?.let { readyHour: FiefUiState.ReadyHour -> readyLabelOf(readyHour) }
    val description: String = readyLine
        ?.let { line: String -> icuStringResource(R.string.reason_with_ready, "reason" to reason, "ready" to line) }
        ?: reason
    return BlockedReason(reason = reason, ready = readyLine, description = description)
}

@Composable
internal fun BlockedReasonLine(blocked: BlockedReason, modifier: Modifier = Modifier) {
    FlowRow(
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
        modifier = modifier.clearAndSetSemantics { },
    ) {
        MyGameText(text = blocked.reason, style = MyGameTypography.body, color = MyGameTheme.colors.rust)
        blocked.ready?.let { ready: String ->
            MyGameText(text = ready, style = MyGameTypography.action, color = MyGameTheme.colors.ink)
        }
    }
}

@Composable
private fun readyLabelOf(ready: FiefUiState.ReadyHour): String = when (ready) {
    is FiefUiState.ReadyHour.InMinutes -> icuStringResource(
        R.string.ready_in_minutes,
        "minutes" to ready.minutes.toString(),
    )
    FiefUiState.ReadyHour.InAnHour -> stringResource(R.string.ready_in_an_hour)
    is FiefUiState.ReadyHour.AtClock -> icuStringResource(
        R.string.ready_at,
        "clock" to clockLabelOf(finishClockOf(ready.readyAt, ready.remaining, ZoneId.systemDefault())),
    )
}
