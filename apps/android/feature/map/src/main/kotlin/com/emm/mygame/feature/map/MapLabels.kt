package com.emm.mygame.feature.map

import android.content.res.Resources
import android.icu.text.ListFormatter
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalResources
import androidx.compose.ui.res.stringResource
import com.emm.mygame.core.designsystem.formatQuantity
import com.emm.mygame.core.network.Terrain
import com.emm.mygame.core.network.TownHireKind
import com.emm.mygame.core.network.TownJobRefusal
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.projection.FinishClock
import com.emm.mygame.core.projection.finishClockOf
import com.emm.mygame.core.ui.getIcuString
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

private val spanish: Locale = Locale.forLanguageTag("es")

private val spanishListFormat: ListFormatter = ListFormatter.getInstance(spanish)

private val clockFormat: DateTimeFormatter = DateTimeFormatter.ofPattern("HH:mm")

private val dayFormat: DateTimeFormatter = DateTimeFormatter.ofPattern("d MMM", spanish)

internal fun terrainNameOf(terrain: Terrain): Int = when (terrain) {
    Terrain.Fields -> R.string.map_terrain_fields
    Terrain.River -> R.string.map_terrain_river
    Terrain.Hills -> R.string.map_terrain_hills
}

internal fun phaseWordsOf(phase: TownSnapshot.JobPhase): Int = when (phase) {
    TownSnapshot.JobPhase.Outbound -> R.string.map_job_out_outbound
    TownSnapshot.JobPhase.Working -> R.string.map_job_out_working
    TownSnapshot.JobPhase.Returning -> R.string.map_job_out_returning
}

private fun resourceNameOf(kind: TownResourceKind): Int = when (kind) {
    TownResourceKind.Money -> R.string.map_resource_money
    TownResourceKind.Food -> R.string.map_resource_food
    TownResourceKind.Power -> R.string.map_resource_power
    TownResourceKind.Material -> R.string.map_resource_material
}

private fun hireSelectorOf(hire: TownHireKind): String = when (hire) {
    TownHireKind.Worker -> "worker"
    TownHireKind.Truck -> "truck"
}

@Composable
internal fun payLineOf(jobOut: MapUiState.JobOut): String {
    val resources: Resources = LocalResources.current
    return resources.getIcuString(R.string.map_job_out_pay, "amounts" to resources.amountsOf(jobOut.pay))
}

@Composable
internal fun quotedPayLineOf(quote: MapUiState.PayQuote.Quoted): String {
    val resources: Resources = LocalResources.current
    return resources.getIcuString(R.string.map_job_pay, "amounts" to resources.amountsOf(quote.pay))
}

private fun Resources.amountsOf(pay: List<MapUiState.PayLine>): String {
    val amounts: List<String> = pay.map { line: MapUiState.PayLine ->
        getIcuString(
            R.string.map_job_amount,
            "amount" to formatQuantity(line.amount),
            "resource" to getString(resourceNameOf(line.resource)),
        )
    }
    return spanishListFormat.format(amounts)
}

@Composable
internal fun jobBlockLineOf(block: MapUiState.JobBlock): String = when (block) {
    MapUiState.JobBlock.CountNeeded -> stringResource(R.string.map_job_count_needed)
    MapUiState.JobBlock.InvalidTeam -> stringResource(R.string.map_refusal_invalid_team)
    MapUiState.JobBlock.HoursNeeded -> stringResource(R.string.map_job_hours_needed)
}

@Composable
internal fun jobRefusalLineOf(refusal: TownJobRefusal): String = when (refusal) {
    TownJobRefusal.InvalidTeam -> stringResource(R.string.map_refusal_invalid_team)
    is TownJobRefusal.JobHoursOutOfRange ->
        icuStringResource(R.string.map_refusal_job_hours_out_of_range, "maxHours" to refusal.maxHours.toString())
    TownJobRefusal.JobSiteOutOfBounds -> stringResource(R.string.map_refusal_job_site_out_of_bounds)
    TownJobRefusal.TeamAlreadyOut -> stringResource(R.string.map_refusal_team_already_out)
    TownJobRefusal.JobToOwnSite -> stringResource(R.string.map_refusal_job_to_own_site)
    TownJobRefusal.SiteHeld -> stringResource(R.string.map_refusal_site_held)
    is TownJobRefusal.NotEnoughHiresAtHome -> notEnoughHiresLineOf(refusal.hire, refusal.count, refusal.atHome)
    TownJobRefusal.JobNotFound -> stringResource(R.string.map_refusal_job_not_found)
    TownJobRefusal.JobAlreadyReturning -> stringResource(R.string.map_refusal_job_already_returning)
    TownJobRefusal.TownNotFound -> stringResource(R.string.map_refusal_town_not_found)
    TownJobRefusal.Unrecognized -> stringResource(R.string.map_refusal_unexpected)
}

@Composable
private fun notEnoughHiresLineOf(hire: TownHireKind, count: Int, atHome: Int): String = icuStringResource(
    R.string.map_refusal_not_enough_hires_at_home,
    "hire" to hireSelectorOf(hire),
    "count" to count,
    "atHome" to atHome.toString(),
)

private fun wholeSecondsOf(duration: Duration): Long = ceil(duration.toDouble(DurationUnit.SECONDS)).toLong()

@Composable
private fun durationLabelOf(duration: Duration): String {
    val whole: Long = wholeSecondsOf(duration)
    val hours: Long = whole / SECONDS_PER_HOUR
    val minutes: Long = whole % SECONDS_PER_HOUR / SECONDS_PER_MINUTE
    return when {
        hours == 0L -> icuStringResource(
            R.string.map_duration_minutes_seconds,
            "minutes" to minutes.toString(),
            "seconds" to (whole % SECONDS_PER_MINUTE).toString().padStart(2, '0'),
        )
        minutes == 0L -> icuStringResource(R.string.map_duration_hours, "hours" to hours.toString())
        else -> icuStringResource(
            R.string.map_duration_hours_minutes,
            "hours" to hours.toString(),
            "minutes" to minutes.toString(),
        )
    }
}

@Composable
private fun timeLeftLabelOf(remaining: Duration): String {
    val whole: Long = wholeSecondsOf(remaining)
    if (whole < SECONDS_PER_MINUTE || whole >= SECONDS_PER_HOUR) return durationLabelOf(whole.seconds)
    return icuStringResource(R.string.map_duration_minutes, "minutes" to (whole / SECONDS_PER_MINUTE).toString())
}

@Composable
internal fun finishLabelOf(remaining: Duration, finishesAt: Instant): String {
    val timeLeft: String = timeLeftLabelOf(remaining)
    if (wholeSecondsOf(remaining).seconds <= 1.hours) return timeLeft
    val finish: FinishClock = finishClockOf(finishesAt, remaining, ZoneId.systemDefault())
    return icuStringResource(R.string.map_finish_with_clock, "timeLeft" to timeLeft, "clock" to clockLabelOf(finish))
}

@Composable
private fun clockLabelOf(finish: FinishClock): String {
    val time: String = finish.at.format(clockFormat)
    return when (finish.day) {
        FinishClock.Day.Today -> time
        FinishClock.Day.Tomorrow -> icuStringResource(R.string.map_finish_tomorrow, "time" to time)
        FinishClock.Day.Later -> icuStringResource(
            R.string.map_finish_day,
            "day" to finish.at.format(dayFormat),
            "time" to time,
        )
    }
}
