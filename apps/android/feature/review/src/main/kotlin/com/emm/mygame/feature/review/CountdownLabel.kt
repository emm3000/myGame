package com.emm.mygame.feature.review

import com.emm.mygame.core.ui.CopyReader
import kotlin.time.Duration

internal fun CopyReader.countdownLabelOf(remaining: Duration): String =
    remaining.toComponents { hours, minutes, seconds, _ ->
        when {
            hours > 0 -> text(
                R.string.slot_countdown_hours,
                "hours" to hours.toString(),
                "minutes" to minutes.toString(),
            )
            minutes > 0 -> text(R.string.slot_countdown_minutes, "minutes" to minutes.toString())
            seconds > 0 -> text(R.string.slot_countdown_seconds, "seconds" to seconds.toString())
            else -> text(R.string.slot_countdown_finished)
        }
    }
