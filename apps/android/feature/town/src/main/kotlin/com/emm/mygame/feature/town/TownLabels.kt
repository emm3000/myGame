package com.emm.mygame.feature.town

import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import com.emm.mygame.core.designsystem.MyGameIcons
import com.emm.mygame.core.network.SeasonKind
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownHiringRefusal
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownWorkRefusal
import com.emm.mygame.core.projection.FinishClock
import com.emm.mygame.core.projection.finishClockOf
import com.emm.mygame.core.ui.icuStringResource
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale
import kotlin.math.ceil
import kotlin.time.Duration
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.seconds
import kotlin.time.DurationUnit
import kotlin.time.Instant

private const val SECONDS_PER_MINUTE: Long = 60

private const val SECONDS_PER_HOUR: Long = 3600

private const val MINUTES_PER_HOUR: Long = 60

private val spanish: Locale = Locale.forLanguageTag("es")

private val clockFormat: DateTimeFormatter = DateTimeFormatter.ofPattern("HH:mm")

private val dayFormat: DateTimeFormatter = DateTimeFormatter.ofPattern("d MMM", spanish)

internal fun placeNameOf(kind: TownBuildingKind): Int = when (kind) {
    TownBuildingKind.Homes -> R.string.town_place_homes
    TownBuildingKind.Farm -> R.string.town_place_farm
    TownBuildingKind.Factory -> R.string.town_place_factory
    TownBuildingKind.PowerStation -> R.string.town_place_power_station
    TownBuildingKind.Storage -> R.string.town_place_storage
    TownBuildingKind.School -> R.string.town_place_school
    TownBuildingKind.Office -> R.string.town_place_office
}

internal fun resourceNameOf(kind: TownResourceKind): Int = when (kind) {
    TownResourceKind.Money -> R.string.town_resource_money
    TownResourceKind.Food -> R.string.town_resource_food
    TownResourceKind.Power -> R.string.town_resource_power
    TownResourceKind.Material -> R.string.town_resource_material
}

internal fun resourceIconOf(kind: TownResourceKind): ImageVector = when (kind) {
    TownResourceKind.Money -> MyGameIcons.money
    TownResourceKind.Food -> MyGameIcons.food
    TownResourceKind.Power -> MyGameIcons.power
    TownResourceKind.Material -> MyGameIcons.material
}

internal fun seasonIconOf(kind: SeasonKind): ImageVector = when (kind) {
    SeasonKind.Spring -> MyGameIcons.spring
    SeasonKind.Summer -> MyGameIcons.summer
    SeasonKind.Fall -> MyGameIcons.fall
    SeasonKind.Winter -> MyGameIcons.winter
}

internal fun seasonNameOf(kind: SeasonKind): Int = when (kind) {
    SeasonKind.Spring -> R.string.town_season_spring
    SeasonKind.Summer -> R.string.town_season_summer
    SeasonKind.Fall -> R.string.town_season_fall
    SeasonKind.Winter -> R.string.town_season_winter
}

internal fun capitalized(name: String): String = name.replaceFirstChar { first: Char -> first.titlecase(spanish) }

internal fun wholeSecondsOf(duration: Duration): Long =
    ceil(duration.toDouble(DurationUnit.SECONDS)).toLong()

@Composable
internal fun workRefusalLineOf(refusal: TownWorkRefusal): String = when (refusal) {
    is TownWorkRefusal.WaitingListFull ->
        icuStringResource(R.string.town_refusal_waiting_list_full, "cap" to refusal.cap)
    is TownWorkRefusal.TopLevelReached ->
        icuStringResource(R.string.town_refusal_top_level_reached, "level" to refusal.level.toString())
    is TownWorkRefusal.NotEnoughPeople -> icuStringResource(
        R.string.town_refusal_not_enough_people,
        "requiredPeople" to refusal.required,
        "freePeople" to refusal.free.toString(),
    )
    TownWorkRefusal.NotEnoughResources -> stringResource(R.string.town_refusal_not_enough_resources)
    is TownWorkRefusal.BuildingWorkNotFound ->
        icuStringResource(R.string.town_refusal_building_work_not_found, "level" to refusal.level.toString())
    TownWorkRefusal.TownNotFound -> stringResource(R.string.town_refusal_town_not_found)
    TownWorkRefusal.Unrecognized -> stringResource(R.string.town_refusal_unexpected)
}

@Composable
internal fun hiringRefusalLineOf(refusal: TownHiringRefusal): String = when (refusal) {
    is TownHiringRefusal.OfficeTooLow -> icuStringResource(
        R.string.town_refusal_office_too_low,
        "officeLevel" to refusal.officeLevel.toString(),
        "requiredOfficeLevel" to refusal.requiredOfficeLevel.toString(),
    )
    TownHiringRefusal.HiringSlotBusy -> stringResource(R.string.town_refusal_hiring_slot_busy)
    is TownHiringRefusal.NotEnoughPeople -> icuStringResource(
        R.string.town_refusal_hiring_not_enough_people,
        "requiredPeople" to refusal.required,
        "freePeople" to refusal.free.toString(),
    )
    TownHiringRefusal.NotEnoughResources -> stringResource(R.string.town_refusal_hiring_not_enough_resources)
    TownHiringRefusal.HiringOrderNotFound -> stringResource(R.string.town_refusal_hiring_order_not_found)
    TownHiringRefusal.TownNotFound -> stringResource(R.string.town_refusal_town_not_found)
    TownHiringRefusal.Unrecognized -> stringResource(R.string.town_refusal_unexpected)
}

@Composable
internal fun durationLabelOf(duration: Duration): String {
    val whole: Long = wholeSecondsOf(duration)
    val hours: Long = whole / SECONDS_PER_HOUR
    val minutes: Long = whole % SECONDS_PER_HOUR / SECONDS_PER_MINUTE
    return when {
        hours == 0L -> icuStringResource(
            R.string.town_duration_minutes_seconds,
            "minutes" to minutes.toString(),
            "seconds" to (whole % SECONDS_PER_MINUTE).toString().padStart(2, '0'),
        )
        minutes == 0L -> icuStringResource(R.string.town_duration_hours, "hours" to hours.toString())
        else -> icuStringResource(
            R.string.town_duration_hours_minutes,
            "hours" to hours.toString(),
            "minutes" to minutes.toString(),
        )
    }
}

@Composable
internal fun timeLeftLabelOf(remaining: Duration): String {
    val whole: Long = wholeSecondsOf(remaining)
    if (whole < SECONDS_PER_MINUTE || whole >= SECONDS_PER_HOUR) return durationLabelOf(whole.seconds)
    return icuStringResource(R.string.town_duration_minutes, "minutes" to (whole / SECONDS_PER_MINUTE).toString())
}

@Composable
internal fun finishLabelOf(remaining: Duration, finishesAt: Instant): String {
    val timeLeft: String = timeLeftLabelOf(remaining)
    if (wholeSecondsOf(remaining).seconds <= 1.hours) return timeLeft
    val finish: FinishClock = finishClockOf(finishesAt, remaining, ZoneId.systemDefault())
    return icuStringResource(R.string.town_finish_with_clock, "timeLeft" to timeLeft, "clock" to clockLabelOf(finish))
}

@Composable
internal fun readyLabelOf(ready: TownUiState.ReadyTime): String {
    val minutesLeft: Long = ceil(wholeSecondsOf(ready.remaining).toDouble() / SECONDS_PER_MINUTE).toLong()
    if (minutesLeft < MINUTES_PER_HOUR) {
        val timeLeft: String = icuStringResource(R.string.town_duration_minutes, "minutes" to minutesLeft.toString())
        return icuStringResource(R.string.town_ready_in, "timeLeft" to timeLeft)
    }
    val finish: FinishClock = finishClockOf(ready.readyAt, ready.remaining, ZoneId.systemDefault())
    return icuStringResource(R.string.town_ready_at, "clock" to clockLabelOf(finish))
}

@Composable
private fun clockLabelOf(finish: FinishClock): String {
    val time: String = finish.at.format(clockFormat)
    return when (finish.day) {
        FinishClock.Day.Today -> time
        FinishClock.Day.Tomorrow -> icuStringResource(R.string.town_finish_tomorrow, "time" to time)
        FinishClock.Day.Later -> icuStringResource(
            R.string.town_finish_day,
            "day" to finish.at.format(dayFormat),
            "time" to time,
        )
    }
}
