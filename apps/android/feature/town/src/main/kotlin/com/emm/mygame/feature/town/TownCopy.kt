package com.emm.mygame.feature.town

import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.projection.FinishClock
import com.emm.mygame.core.projection.finishClockOf
import com.emm.mygame.core.ui.CopyReader
import com.emm.mygame.core.ui.DurationCopy
import com.emm.mygame.core.ui.finishClockLabelOf
import com.emm.mygame.core.ui.timeLeftLabelOf
import com.emm.mygame.core.ui.wholeSecondsOf
import java.time.ZoneId
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.seconds

internal fun placeNameOf(kind: TownBuildingKind): Int = when (kind) {
    TownBuildingKind.Homes -> R.string.town_place_homes
    TownBuildingKind.Farm -> R.string.town_place_farm
    TownBuildingKind.Factory -> R.string.town_place_factory
    TownBuildingKind.PowerStation -> R.string.town_place_power_station
    TownBuildingKind.Storage -> R.string.town_place_storage
    TownBuildingKind.School -> R.string.town_place_school
    TownBuildingKind.Office -> R.string.town_place_office
}

internal fun CopyReader.shortMarked(spoken: String, isShort: Boolean): String =
    if (isShort) spoken + text(R.string.town_short_mark) else spoken

internal fun CopyReader.readyWordsOf(ready: ReadyTime): String =
    if (ready.isWithinTheHour) text(R.string.town_ready_in) else text(R.string.town_ready_at)

internal fun CopyReader.readyTimeLabelOf(ready: ReadyTime): String {
    if (ready.isWithinTheHour) return timeLeftLabelOf(ready.remaining, townDurationCopy)
    val finish: FinishClock = finishClockOf(ready.readyAt, ready.remaining, ZoneId.systemDefault())
    return finishClockLabelOf(finish, townDurationCopy)
}

private val ReadyTime.isWithinTheHour: Boolean
    get() = wholeSecondsOf(remaining).seconds < 1.hours

internal val townDurationCopy: DurationCopy = DurationCopy(
    minutesSeconds = R.string.town_duration_minutes_seconds,
    hours = R.string.town_duration_hours,
    hoursMinutes = R.string.town_duration_hours_minutes,
    minutes = R.string.town_duration_minutes,
    finishWithClock = R.string.town_finish_with_clock,
    finishTomorrow = R.string.town_finish_tomorrow,
    finishDay = R.string.town_finish_day,
)
