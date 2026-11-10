package com.emm.mygame.feature.fief

import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource
import com.emm.mygame.core.ui.icuStringResource
import kotlin.time.Duration

@Composable
internal fun countdownLabelOf(remaining: Duration): String = remaining.toComponents { hours, minutes, seconds, _ ->
    when {
        hours > 0 -> icuStringResource(
            R.string.slot_countdown_hours,
            "hours" to hours.toString(),
            "minutes" to minutes.toString(),
        )
        minutes > 0 -> icuStringResource(R.string.slot_countdown_minutes, "minutes" to minutes.toString())
        seconds > 0 -> icuStringResource(R.string.slot_countdown_seconds, "seconds" to seconds.toString())
        else -> stringResource(R.string.slot_countdown_finished)
    }
}
