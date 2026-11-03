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
import java.time.ZoneId

internal data class BlockedReason(val reason: String, val ready: String?, val description: String)

@Composable
internal fun blockedReasonOf(reason: String, ready: FiefUiState.ReadyHour?): BlockedReason {
    val readyLine: String? = ready?.let { readyHour: FiefUiState.ReadyHour -> readyLabelOf(readyHour) }
    val description: String = readyLine
        ?.let { line: String -> stringResource(R.string.reason_with_ready, reason, line) }
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
    is FiefUiState.ReadyHour.InMinutes ->
        if (ready.minutes >= MINUTES_PER_HOUR) {
            stringResource(R.string.ready_in_an_hour)
        } else {
            stringResource(R.string.ready_in_minutes, ready.minutes)
        }
    is FiefUiState.ReadyHour.AtClock -> stringResource(
        R.string.ready_at,
        clockLabelOf(finishClockOf(ready.readyAt, ready.remaining, ZoneId.systemDefault())),
    )
}

private const val MINUTES_PER_HOUR: Int = 60
