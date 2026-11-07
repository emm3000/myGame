package com.emm.mygame.feature.school

import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.TownLessonRefusal
import com.emm.mygame.core.network.TownResourceKind
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

private val clockFormat: DateTimeFormatter = DateTimeFormatter.ofPattern("HH:mm")

private val dayFormat: DateTimeFormatter = DateTimeFormatter.ofPattern("d MMM", Locale.forLanguageTag("es"))

private const val SECONDS_PER_MINUTE: Long = 60

private const val SECONDS_PER_HOUR: Long = 3600

internal fun resourceNameOf(kind: TownResourceKind): Int = when (kind) {
    TownResourceKind.Money -> R.string.school_resource_money
    TownResourceKind.Food -> R.string.school_resource_food
    TownResourceKind.Power -> R.string.school_resource_power
    TownResourceKind.Material -> R.string.school_resource_material
}

@Composable
internal fun refusalLineOf(refusal: TownLessonRefusal): String = when (refusal) {
    is TownLessonRefusal.LearningCapReached -> icuStringResource(
        R.string.school_refusal_learning_cap_reached,
        "cardsInLearning" to refusal.inLearning.toString(),
        "learningCap" to refusal.cap.toString(),
    )
    TownLessonRefusal.StudySlotBusy -> stringResource(R.string.school_refusal_study_slot_busy)
    TownLessonRefusal.LessonSchoolTooLow -> stringResource(R.string.school_refusal_lesson_school_too_low)
    TownLessonRefusal.LessonAlreadyStudied -> stringResource(R.string.school_refusal_lesson_already_studied)
    TownLessonRefusal.LessonUnderStudy -> stringResource(R.string.school_refusal_lesson_under_study)
    TownLessonRefusal.LessonStudyNotFound -> stringResource(R.string.school_refusal_lesson_study_not_found)
    TownLessonRefusal.TownNotFound -> stringResource(R.string.school_refusal_town_not_found)
    TownLessonRefusal.Unrecognized -> stringResource(R.string.school_refusal_unexpected)
}

@Composable
internal fun requestAnswerOf(request: SchoolUiState.LessonRequest): String? = when (request) {
    is SchoolUiState.LessonRequest.Refused -> refusalLineOf(request.refusal)
    is SchoolUiState.LessonRequest.Unreachable -> stringResource(R.string.school_refusal_unexpected)
    SchoolUiState.LessonRequest.Idle, SchoolUiState.LessonRequest.Waiting -> null
}

@Composable
internal fun lessonSummaryOf(card: SchoolUiState.LessonCard): String = icuStringResource(
    R.string.school_lesson_summary,
    "words" to icuStringResource(R.string.school_lesson_words, "count" to card.wordCount),
    "skill" to icuStringResource(
        R.string.school_lesson_reward,
        "percent" to card.ratePercent.toString(),
        "resource" to stringResource(resourceNameOf(card.resource)),
    ),
)

@Composable
internal fun readWordsLabelOf(lesson: LessonId, number: Int, shown: LessonId): String {
    val readWords: String = stringResource(R.string.school_lesson_read_words)
    if (lesson == shown) return readWords
    return "${icuStringResource(R.string.school_lesson_title, "number" to number.toString())} · $readWords"
}

@Composable
internal fun durationLabelOf(duration: Duration): String {
    val whole: Long = wholeSecondsOf(duration)
    val hours: Long = whole / SECONDS_PER_HOUR
    val minutes: Long = whole % SECONDS_PER_HOUR / SECONDS_PER_MINUTE
    return when {
        hours == 0L -> icuStringResource(
            R.string.school_duration_minutes_seconds,
            "minutes" to minutes.toString(),
            "seconds" to (whole % SECONDS_PER_MINUTE).toString().padStart(2, '0'),
        )
        minutes == 0L -> icuStringResource(R.string.school_duration_hours, "hours" to hours.toString())
        else -> icuStringResource(
            R.string.school_duration_hours_minutes,
            "hours" to hours.toString(),
            "minutes" to minutes.toString(),
        )
    }
}

@Composable
internal fun timeLeftLabelOf(remaining: Duration): String {
    val whole: Long = wholeSecondsOf(remaining)
    if (whole < SECONDS_PER_MINUTE || whole >= SECONDS_PER_HOUR) return durationLabelOf(whole.seconds)
    return icuStringResource(R.string.school_duration_minutes, "minutes" to (whole / SECONDS_PER_MINUTE).toString())
}

private fun wholeSecondsOf(duration: Duration): Long = ceil(duration.toDouble(DurationUnit.SECONDS)).toLong()

@Composable
internal fun finishLabelOf(remaining: Duration, finishesAt: Instant): String {
    val timeLeft: String = timeLeftLabelOf(remaining)
    if (wholeSecondsOf(remaining).seconds <= 1.hours) return timeLeft
    val finish: FinishClock = finishClockOf(finishesAt, remaining, ZoneId.systemDefault())
    return icuStringResource(R.string.school_finish_with_clock, "timeLeft" to timeLeft, "clock" to clockLabelOf(finish))
}

@Composable
private fun clockLabelOf(finish: FinishClock): String {
    val time: String = finish.at.format(clockFormat)
    return when (finish.day) {
        FinishClock.Day.Today -> time
        FinishClock.Day.Tomorrow -> icuStringResource(R.string.school_finish_tomorrow, "time" to time)
        FinishClock.Day.Later -> icuStringResource(
            R.string.school_finish_day,
            "day" to finish.at.format(dayFormat),
            "time" to time,
        )
    }
}
