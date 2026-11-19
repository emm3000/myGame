package com.emm.mygame.core.ui

import androidx.annotation.StringRes

data class DurationCopy(
    @StringRes val minutesSeconds: Int,
    @StringRes val hours: Int,
    @StringRes val hoursMinutes: Int,
    @StringRes val minutes: Int,
    @StringRes val finishWithClock: Int,
    @StringRes val finishTomorrow: Int,
    @StringRes val finishDay: Int,
)
