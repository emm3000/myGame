package com.emm.mygame.feature.school

import android.icu.text.DateTimePatternGenerator
import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.LessonName
import com.emm.mygame.core.network.TownLessonRefusal
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.projection.FinishClock
import com.emm.mygame.core.projection.finishClockOf
import com.emm.mygame.core.ui.CopyReader
import com.emm.mygame.core.ui.PlayerCopy
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

private const val MONTH_AND_DAY: String = "MMMd"

private const val SECONDS_PER_MINUTE: Long = 60

private const val SECONDS_PER_HOUR: Long = 3600

private fun dayFormatIn(locale: Locale): DateTimeFormatter =
    DateTimeFormatter.ofPattern(DateTimePatternGenerator.getInstance(locale).getBestPattern(MONTH_AND_DAY), locale)

internal fun fixedLabelOf(text: String): MyGameLabel = MyGameLabel(text = text, translation = null)

internal fun resourceNameOf(kind: TownResourceKind): Int = when (kind) {
    TownResourceKind.Money -> R.string.school_resource_money
    TownResourceKind.Food -> R.string.school_resource_food
    TownResourceKind.Power -> R.string.school_resource_power
    TownResourceKind.Material -> R.string.school_resource_material
}

private fun CopyReader.refusalLineOf(refusal: TownLessonRefusal): String = when (refusal) {
    is TownLessonRefusal.LearningCapReached -> text(
        R.string.school_refusal_learning_cap_reached,
        "cardsInLearning" to refusal.inLearning.toString(),
        "learningCap" to refusal.cap.toString(),
    )
    TownLessonRefusal.StudySlotBusy -> text(R.string.school_refusal_study_slot_busy)
    TownLessonRefusal.LessonSchoolTooLow -> text(R.string.school_refusal_lesson_school_too_low)
    TownLessonRefusal.LessonAlreadyStudied -> text(R.string.school_refusal_lesson_already_studied)
    TownLessonRefusal.LessonUnderStudy -> text(R.string.school_refusal_lesson_under_study)
    TownLessonRefusal.LessonStudyNotFound -> text(R.string.school_refusal_lesson_study_not_found)
    TownLessonRefusal.TownNotFound -> text(R.string.school_refusal_town_not_found)
    TownLessonRefusal.Unrecognized -> text(R.string.school_refusal_unexpected)
}

internal fun PlayerCopy.requestAnswerOf(request: SchoolUiState.LessonRequest): String? = when (request) {
    is SchoolUiState.LessonRequest.Refused -> fixedCopy { refusalLineOf(request.refusal) }
    is SchoolUiState.LessonRequest.Unreachable -> fixedCopy(R.string.school_refusal_unexpected)
    SchoolUiState.LessonRequest.Idle, SchoolUiState.LessonRequest.Waiting -> null
}

internal fun CopyReader.lessonSummaryOf(card: SchoolUiState.LessonCard): String = text(
    R.string.school_lesson_summary,
    "words" to text(R.string.school_lesson_words, "count" to card.wordCount),
    "skill" to text(
        R.string.school_lesson_reward,
        "percent" to card.ratePercent.toString(),
        "resource" to text(resourceNameOf(card.resource)),
    ),
)

internal fun PlayerCopy.readWordsLabelOf(lesson: LessonId, name: LessonName, shown: LessonId): MyGameLabel {
    if (lesson == shown) return chrome(R.string.school_lesson_read_words)
    return lessonLineOf(name) { title: String -> "$title · ${text(R.string.school_lesson_read_words)}" }
}

internal fun CopyReader.durationLabelOf(duration: Duration): String {
    val whole: Long = wholeSecondsOf(duration)
    val hours: Long = whole / SECONDS_PER_HOUR
    val minutes: Long = whole % SECONDS_PER_HOUR / SECONDS_PER_MINUTE
    return when {
        hours == 0L -> text(
            R.string.school_duration_minutes_seconds,
            "minutes" to minutes.toString(),
            "seconds" to (whole % SECONDS_PER_MINUTE).toString().padStart(2, '0'),
        )
        minutes == 0L -> text(R.string.school_duration_hours, "hours" to hours.toString())
        else -> text(
            R.string.school_duration_hours_minutes,
            "hours" to hours.toString(),
            "minutes" to minutes.toString(),
        )
    }
}

internal fun CopyReader.timeLeftLabelOf(remaining: Duration): String {
    val whole: Long = wholeSecondsOf(remaining)
    if (whole < SECONDS_PER_MINUTE || whole >= SECONDS_PER_HOUR) return durationLabelOf(whole.seconds)
    return text(R.string.school_duration_minutes, "minutes" to (whole / SECONDS_PER_MINUTE).toString())
}

private fun wholeSecondsOf(duration: Duration): Long = ceil(duration.toDouble(DurationUnit.SECONDS)).toLong()

internal fun CopyReader.finishLabelOf(remaining: Duration, finishesAt: Instant): String {
    val timeLeft: String = timeLeftLabelOf(remaining)
    if (wholeSecondsOf(remaining).seconds <= 1.hours) return timeLeft
    val finish: FinishClock = finishClockOf(finishesAt, remaining, ZoneId.systemDefault())
    return text(R.string.school_finish_with_clock, "timeLeft" to timeLeft, "clock" to clockLabelOf(finish))
}

private fun CopyReader.clockLabelOf(finish: FinishClock): String {
    val time: String = finish.at.format(clockFormat)
    return when (finish.day) {
        FinishClock.Day.Today -> time
        FinishClock.Day.Tomorrow -> text(R.string.school_finish_tomorrow, "time" to time)
        FinishClock.Day.Later -> text(
            R.string.school_finish_day,
            "day" to finish.at.format(dayFormatIn(locale)),
            "time" to time,
        )
    }
}
