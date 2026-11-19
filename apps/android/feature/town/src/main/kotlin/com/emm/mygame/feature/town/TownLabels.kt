package com.emm.mygame.feature.town

import androidx.compose.ui.graphics.vector.ImageVector
import com.emm.mygame.core.designsystem.MyGameIcons
import com.emm.mygame.core.network.NeededWordKind
import com.emm.mygame.core.network.SeasonKind
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownHiringRefusal
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownWorkRefusal
import com.emm.mygame.core.projection.FinishClock
import com.emm.mygame.core.projection.finishClockOf
import com.emm.mygame.core.ui.CopyReader
import com.emm.mygame.core.ui.DurationCopy
import com.emm.mygame.core.ui.finishClockLabelOf
import com.emm.mygame.core.ui.wholeSecondsOf
import java.time.ZoneId
import kotlin.math.ceil
import kotlin.time.Duration.Companion.hours

private const val SECONDS_PER_MINUTE: Long = 60

private const val MINUTES_PER_HOUR: Long = 60

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

internal fun seasonSelectorOf(kind: SeasonKind): String = when (kind) {
    SeasonKind.Spring -> "spring"
    SeasonKind.Summer -> "summer"
    SeasonKind.Fall -> "fall"
    SeasonKind.Winter -> "winter"
}

internal fun neededWordSelectorOf(kind: NeededWordKind): String = when (kind) {
    NeededWordKind.Stable -> "stable"
    NeededWordKind.Retained -> "retained"
}

internal fun seasonNameOf(kind: SeasonKind): Int = when (kind) {
    SeasonKind.Spring -> R.string.town_season_spring
    SeasonKind.Summer -> R.string.town_season_summer
    SeasonKind.Fall -> R.string.town_season_fall
    SeasonKind.Winter -> R.string.town_season_winter
}

internal fun CopyReader.capitalized(name: String): String =
    name.replaceFirstChar { first: Char -> first.titlecase(locale) }

internal fun CopyReader.shortMarked(spoken: String, isShort: Boolean): String =
    if (isShort) spoken + text(R.string.town_short_mark) else spoken

internal fun CopyReader.workRefusalLineOf(refusal: TownWorkRefusal): String = when (refusal) {
    is TownWorkRefusal.WaitingListFull -> text(R.string.town_refusal_waiting_list_full, "cap" to refusal.cap)
    is TownWorkRefusal.TopLevelReached ->
        text(R.string.town_refusal_top_level_reached, "level" to refusal.level.toString())
    is TownWorkRefusal.NotEnoughPeople -> text(
        R.string.town_refusal_not_enough_people,
        "requiredPeople" to refusal.required,
        "freePeople" to refusal.free.toString(),
    )
    is TownWorkRefusal.NotEnoughWords -> text(
        R.string.town_refusal_not_enough_words,
        "needed" to refusal.needed.toString(),
        "held" to refusal.held.toString(),
        "standing" to neededWordSelectorOf(refusal.standing),
    )
    TownWorkRefusal.NotEnoughResources -> text(R.string.town_refusal_not_enough_resources)
    is TownWorkRefusal.BuildingWorkNotFound ->
        text(R.string.town_refusal_building_work_not_found, "level" to refusal.level.toString())
    TownWorkRefusal.TownNotFound -> text(R.string.town_refusal_town_not_found)
    TownWorkRefusal.Unrecognized -> text(R.string.town_refusal_unexpected)
}

internal fun CopyReader.hiringRefusalLineOf(refusal: TownHiringRefusal): String = when (refusal) {
    is TownHiringRefusal.OfficeTooLow -> text(
        R.string.town_refusal_office_too_low,
        "officeLevel" to refusal.officeLevel.toString(),
        "requiredOfficeLevel" to refusal.requiredOfficeLevel.toString(),
    )
    TownHiringRefusal.HiringSlotBusy -> text(R.string.town_refusal_hiring_slot_busy)
    is TownHiringRefusal.NotEnoughPeople -> text(
        R.string.town_refusal_hiring_not_enough_people,
        "requiredPeople" to refusal.required,
        "freePeople" to refusal.free.toString(),
    )
    TownHiringRefusal.NotEnoughResources -> text(R.string.town_refusal_hiring_not_enough_resources)
    TownHiringRefusal.HiringOrderNotFound -> text(R.string.town_refusal_hiring_order_not_found)
    TownHiringRefusal.TownNotFound -> text(R.string.town_refusal_town_not_found)
    TownHiringRefusal.Unrecognized -> text(R.string.town_refusal_unexpected)
}

internal fun CopyReader.readyLabelOf(ready: TownUiState.ReadyTime): String {
    val minutesLeft: Long = ceil(wholeSecondsOf(ready.remaining).toDouble() / SECONDS_PER_MINUTE).toLong()
    if (minutesLeft < MINUTES_PER_HOUR) {
        val timeLeft: String = text(R.string.town_duration_minutes, "minutes" to minutesLeft.toString())
        return text(R.string.town_ready_in, "timeLeft" to timeLeft)
    }
    val finish: FinishClock = finishClockOf(ready.readyAt, ready.remaining, ZoneId.systemDefault())
    return text(R.string.town_ready_at, "clock" to finishClockLabelOf(finish, townDurationCopy))
}

internal fun CopyReader.fillLabelOf(fill: TownUiState.FillTime): String {
    val finish: FinishClock = finishClockOf(fill.fullAt, fill.remaining, ZoneId.systemDefault())
    return text(R.string.town_full_at, "clock" to finishClockLabelOf(finish, townDurationCopy))
}

internal val townDurationCopy: DurationCopy = DurationCopy(
    minutesSeconds = R.string.town_duration_minutes_seconds,
    hours = R.string.town_duration_hours,
    hoursMinutes = R.string.town_duration_hours_minutes,
    minutes = R.string.town_duration_minutes,
    finishWithClock = R.string.town_finish_with_clock,
    finishTomorrow = R.string.town_finish_tomorrow,
    finishDay = R.string.town_finish_day,
)
