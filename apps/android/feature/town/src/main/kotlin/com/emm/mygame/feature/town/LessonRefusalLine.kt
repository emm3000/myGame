package com.emm.mygame.feature.town

import com.emm.mygame.core.network.TownLessonRefusal
import com.emm.mygame.core.ui.CopyReader

internal fun CopyReader.lessonRefusalLineOf(refusal: TownLessonRefusal, capWait: TownStatusUiState.CapWait?): String =
    when (refusal) {
        is TownLessonRefusal.LearningCapReached -> capRefusalLineOf(refusal, capWait)
        TownLessonRefusal.StudySlotBusy -> text(R.string.town_refusal_study_slot_busy)
        TownLessonRefusal.LessonSchoolTooLow -> text(R.string.town_refusal_lesson_school_too_low)
        TownLessonRefusal.LessonAlreadyStudied -> text(R.string.town_refusal_lesson_already_studied)
        TownLessonRefusal.LessonUnderStudy -> text(R.string.town_refusal_lesson_under_study)
        TownLessonRefusal.TownNotFound -> text(R.string.town_refusal_town_not_found)
        TownLessonRefusal.LessonStudyNotFound, TownLessonRefusal.Unrecognized -> text(R.string.town_refusal_unexpected)
    }

private fun CopyReader.capRefusalLineOf(
    refusal: TownLessonRefusal.LearningCapReached,
    capWait: TownStatusUiState.CapWait?,
): String {
    if (capWait == null) {
        return text(
            R.string.town_refusal_learning_cap_reached,
            "cardsInLearning" to refusal.inLearning.toString(),
            "learningCap" to refusal.cap.toString(),
        )
    }
    return text(
        R.string.town_refusal_learning_cap_next_word_due,
        "cardsInLearning" to refusal.inLearning.toString(),
        "learningCap" to refusal.cap.toString(),
        "timeLeft" to finishLabelOf(capWait.remaining, capWait.dueAt),
    )
}
