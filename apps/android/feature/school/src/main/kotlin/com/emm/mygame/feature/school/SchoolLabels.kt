package com.emm.mygame.feature.school

import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.network.LessonName
import com.emm.mygame.core.network.TownLessonRefusal
import com.emm.mygame.core.ui.CopyReader
import com.emm.mygame.core.ui.DurationCopy
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.finishLabelOf

internal fun fixedLabelOf(text: String): MyGameLabel = MyGameLabel(text = text, translation = null)

internal fun resourceNameOf(kind: TownResourceKind): Int = when (kind) {
    TownResourceKind.Money -> R.string.school_resource_money
    TownResourceKind.Food -> R.string.school_resource_food
    TownResourceKind.Power -> R.string.school_resource_power
    TownResourceKind.Material -> R.string.school_resource_material
}

private fun CopyReader.refusalLineOf(refusal: TownLessonRefusal, opening: SchoolUiState.CapOpening): String =
    when (refusal) {
        is TownLessonRefusal.LearningCapReached -> capRefusalLineOf(refusal, opening)
        TownLessonRefusal.StudySlotBusy -> text(R.string.school_refusal_study_slot_busy)
        TownLessonRefusal.LessonSchoolTooLow -> text(R.string.school_refusal_lesson_school_too_low)
        TownLessonRefusal.LessonAlreadyStudied -> text(R.string.school_refusal_lesson_already_studied)
        TownLessonRefusal.LessonUnderStudy -> text(R.string.school_refusal_lesson_under_study)
        TownLessonRefusal.LessonStudyNotFound -> text(R.string.school_refusal_lesson_study_not_found)
        TownLessonRefusal.TownNotFound -> text(R.string.school_refusal_town_not_found)
        TownLessonRefusal.Unrecognized -> text(R.string.school_refusal_unexpected)
    }

private fun CopyReader.capRefusalLineOf(
    refusal: TownLessonRefusal.LearningCapReached,
    opening: SchoolUiState.CapOpening,
): String = when (opening) {
    SchoolUiState.CapOpening.ReviewsDue -> text(
        R.string.school_refusal_learning_cap_reached,
        "cardsInLearning" to refusal.inLearning.toString(),
        "learningCap" to refusal.cap.toString(),
    )
    is SchoolUiState.CapOpening.NextWordDue -> text(
        R.string.school_refusal_learning_cap_next_word_due,
        "cardsInLearning" to refusal.inLearning.toString(),
        "learningCap" to refusal.cap.toString(),
        "timeLeft" to finishLabelOf(opening.remaining, opening.dueAt, schoolDurationCopy),
    )
}

internal fun PlayerCopy.requestAnswerOf(
    request: SchoolUiState.LessonRequest,
    opening: SchoolUiState.CapOpening,
): String? = when (request) {
    is SchoolUiState.LessonRequest.Refused -> fixedCopy { refusalLineOf(request.refusal, opening) }
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

internal fun PlayerCopy.pastCapLabelOf(words: Int, opening: SchoolUiState.CapOpening): MyGameLabel =
    when (opening) {
        SchoolUiState.CapOpening.ReviewsDue -> chrome(R.string.school_learning_full, "count" to words)
        is SchoolUiState.CapOpening.NextWordDue -> chrome {
            text(
                R.string.school_learning_full_next_word_due,
                "count" to words,
                "timeLeft" to finishLabelOf(opening.remaining, opening.dueAt, schoolDurationCopy),
            )
        }
    }

internal val schoolDurationCopy: DurationCopy = DurationCopy(
    minutesSeconds = R.string.school_duration_minutes_seconds,
    hours = R.string.school_duration_hours,
    hoursMinutes = R.string.school_duration_hours_minutes,
    minutes = R.string.school_duration_minutes,
    finishWithClock = R.string.school_finish_with_clock,
    finishTomorrow = R.string.school_finish_tomorrow,
    finishDay = R.string.school_finish_day,
)
