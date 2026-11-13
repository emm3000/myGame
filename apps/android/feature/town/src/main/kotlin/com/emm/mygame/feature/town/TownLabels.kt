package com.emm.mygame.feature.town

import androidx.compose.ui.graphics.vector.ImageVector
import com.emm.mygame.core.designsystem.MyGameIcons
import com.emm.mygame.core.network.SeasonKind
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownHiringRefusal
import com.emm.mygame.core.network.TownLessonRefusal
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownWorkRefusal
import com.emm.mygame.core.projection.FinishClock
import com.emm.mygame.core.projection.finishClockOf
import com.emm.mygame.core.ui.CopyReader
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

private const val SPANISH_LANGUAGE: String = "es"

private val clockFormat: DateTimeFormatter = DateTimeFormatter.ofPattern("HH:mm")

private fun dayFormatIn(locale: Locale): DateTimeFormatter =
    DateTimeFormatter.ofPattern(if (locale.language == SPANISH_LANGUAGE) "d MMM" else "MMM d", locale)

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

internal fun wholeSecondsOf(duration: Duration): Long =
    ceil(duration.toDouble(DurationUnit.SECONDS)).toLong()

internal fun CopyReader.workRefusalLineOf(refusal: TownWorkRefusal): String = when (refusal) {
    is TownWorkRefusal.WaitingListFull -> text(R.string.town_refusal_waiting_list_full, "cap" to refusal.cap)
    is TownWorkRefusal.TopLevelReached ->
        text(R.string.town_refusal_top_level_reached, "level" to refusal.level.toString())
    is TownWorkRefusal.NotEnoughPeople -> text(
        R.string.town_refusal_not_enough_people,
        "requiredPeople" to refusal.required,
        "freePeople" to refusal.free.toString(),
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

internal fun CopyReader.durationLabelOf(duration: Duration): String {
    val whole: Long = wholeSecondsOf(duration)
    val hours: Long = whole / SECONDS_PER_HOUR
    val minutes: Long = whole % SECONDS_PER_HOUR / SECONDS_PER_MINUTE
    return when {
        hours == 0L -> text(
            R.string.town_duration_minutes_seconds,
            "minutes" to minutes.toString(),
            "seconds" to (whole % SECONDS_PER_MINUTE).toString().padStart(2, '0'),
        )
        minutes == 0L -> text(R.string.town_duration_hours, "hours" to hours.toString())
        else -> text(
            R.string.town_duration_hours_minutes,
            "hours" to hours.toString(),
            "minutes" to minutes.toString(),
        )
    }
}

internal fun CopyReader.timeLeftLabelOf(remaining: Duration): String {
    val whole: Long = wholeSecondsOf(remaining)
    if (whole < SECONDS_PER_MINUTE || whole >= SECONDS_PER_HOUR) return durationLabelOf(whole.seconds)
    return text(R.string.town_duration_minutes, "minutes" to (whole / SECONDS_PER_MINUTE).toString())
}

internal fun CopyReader.finishLabelOf(remaining: Duration, finishesAt: Instant): String {
    val timeLeft: String = timeLeftLabelOf(remaining)
    if (wholeSecondsOf(remaining).seconds <= 1.hours) return timeLeft
    val finish: FinishClock = finishClockOf(finishesAt, remaining, ZoneId.systemDefault())
    return text(R.string.town_finish_with_clock, "timeLeft" to timeLeft, "clock" to clockLabelOf(finish))
}

internal fun CopyReader.readyLabelOf(ready: TownUiState.ReadyTime): String {
    val minutesLeft: Long = ceil(wholeSecondsOf(ready.remaining).toDouble() / SECONDS_PER_MINUTE).toLong()
    if (minutesLeft < MINUTES_PER_HOUR) {
        val timeLeft: String = text(R.string.town_duration_minutes, "minutes" to minutesLeft.toString())
        return text(R.string.town_ready_in, "timeLeft" to timeLeft)
    }
    val finish: FinishClock = finishClockOf(ready.readyAt, ready.remaining, ZoneId.systemDefault())
    return text(R.string.town_ready_at, "clock" to clockLabelOf(finish))
}

internal fun CopyReader.fillLabelOf(fill: TownUiState.FillTime): String {
    val finish: FinishClock = finishClockOf(fill.fullAt, fill.remaining, ZoneId.systemDefault())
    return text(R.string.town_full_at, "clock" to clockLabelOf(finish))
}

private fun CopyReader.clockLabelOf(finish: FinishClock): String {
    val time: String = finish.at.format(clockFormat)
    return when (finish.day) {
        FinishClock.Day.Today -> time
        FinishClock.Day.Tomorrow -> text(R.string.town_finish_tomorrow, "time" to time)
        FinishClock.Day.Later -> text(
            R.string.town_finish_day,
            "day" to finish.at.format(dayFormatIn(locale)),
            "time" to time,
        )
    }
}

internal fun CopyReader.lessonRefusalLineOf(refusal: TownLessonRefusal): String = when (refusal) {
    is TownLessonRefusal.LearningCapReached -> text(
        R.string.town_refusal_learning_cap_reached,
        "cardsInLearning" to refusal.inLearning.toString(),
        "learningCap" to refusal.cap.toString(),
    )
    TownLessonRefusal.StudySlotBusy -> text(R.string.town_refusal_study_slot_busy)
    TownLessonRefusal.LessonSchoolTooLow -> text(R.string.town_refusal_lesson_school_too_low)
    TownLessonRefusal.LessonAlreadyStudied -> text(R.string.town_refusal_lesson_already_studied)
    TownLessonRefusal.LessonUnderStudy -> text(R.string.town_refusal_lesson_under_study)
    TownLessonRefusal.TownNotFound -> text(R.string.town_refusal_town_not_found)
    TownLessonRefusal.LessonStudyNotFound, TownLessonRefusal.Unrecognized -> text(R.string.town_refusal_unexpected)
}
