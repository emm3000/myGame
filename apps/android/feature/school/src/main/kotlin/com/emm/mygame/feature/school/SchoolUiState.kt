package com.emm.mygame.feature.school

import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.learning.TextId
import com.emm.mygame.core.model.town.LessonName
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.guidance.NextStepCard
import com.emm.mygame.core.model.town.school.SchoolPathCounts
import com.emm.mygame.core.model.town.school.TownLessonRefusal
import com.emm.mygame.core.ui.DurationMark
import kotlin.time.Duration
import kotlin.time.Instant

sealed interface SchoolUiState {

    data object Loading : SchoolUiState

    data object Failed : SchoolUiState

    data class Content(
        val learning: LearningLine,
        val slot: SlotLine,
        val skills: List<SkillLine>,
        val lessons: List<LessonCard>,
        val releasedLessons: List<ReleasedLessonCard>,
        val texts: List<TextCard>,
        val studyMark: DurationMark?,
        val nextStep: NextStepCard,
        val start: LessonRequestStatus,
        val stop: LessonRequestStatus,
        val isHoldoutNoteShown: Boolean,
        val bandLines: List<TownSnapshot.BandLine>,
        val reviews: ReviewsLine?,
        val selected: LessonId? = null,
    ) : SchoolUiState {

        val shown: LessonCard?
            get() = lessons.featuredWith(selected)

        val isNextStepAhead: Boolean
            get() = selected == null && nextStep.action.isAheadOfTheShelf()

        val blockLesson: LessonCard?
            get() = shown.takeUnless { isNextStepAhead }

        fun isStepLesson(card: LessonCard): Boolean =
            (nextStep.action as? NextStepCard.Action.Study)?.number == card.number
    }

    data class TextCard(val text: TextId, val title: String)

    sealed interface ReviewsLine {

        data class Due(val count: Int, val readFirst: LessonId?) : ReviewsLine

        data class NoneDue(val nextReview: NextReview?) : ReviewsLine
    }

    data class NextReview(val remaining: Duration, val at: Instant)

    data class LearningLine(val inLearning: Int, val cap: Int, val pastCapWords: Int?, val opening: CapOpening)

    sealed interface CapOpening {

        data object ReviewsDue : CapOpening

        data class NextWordDue(val remaining: Duration, val dueAt: Instant) : CapOpening
    }

    sealed interface SlotLine {

        data object Idle : SlotLine

        sealed interface Running : SlotLine {

            val lesson: LessonId

            val name: LessonName
        }

        data class Busy(
            override val lesson: LessonId,
            override val name: LessonName,
            val remaining: Duration,
            val total: Duration,
        ) : Running

        data class Done(override val lesson: LessonId, override val name: LessonName) : Running
    }

    data class SkillLine(
        val lesson: LessonId,
        val resource: TownResourceKind,
        val level: Int,
        val ratePercent: Int,
    )

    data class LessonCard(
        val lesson: LessonId,
        val number: Int,
        val theme: String,
        val wordCount: Int,
        val enteringWordCount: Int,
        val resource: TownResourceKind,
        val ratePercent: Int,
        val duration: Duration,
        val path: SchoolPathCounts,
        val state: LessonState,
    )

    data class ReleasedLessonCard(
        val lesson: LessonId,
        val name: LessonName.Released,
        val wordCount: Int,
        val duration: Duration,
        val path: SchoolPathCounts,
        val state: LessonState,
    )

    sealed interface LessonState {

        data object Studied : LessonState

        data object Studying : LessonState

        data class Open(val block: LessonBlock?) : LessonState
    }

    sealed interface LessonBlock {

        data class SlotBusy(val name: LessonName, val remaining: Duration, val freesAt: Instant) : LessonBlock

        data class SchoolTooLow(val requiredLevel: Int) : LessonBlock

        data class CapReached(val shortWords: Int) : LessonBlock
    }

    sealed interface LessonRequestStatus {

        data object Idle : LessonRequestStatus

        data object Waiting : LessonRequestStatus

        data class Refused(val lesson: LessonId, val refusal: TownLessonRefusal) : LessonRequestStatus

        data class Unreachable(val lesson: LessonId) : LessonRequestStatus
    }
}

private fun NextStepCard.Action.isAheadOfTheShelf(): Boolean = when (this) {
    is NextStepCard.Action.OpenHoldoutCheck, is NextStepCard.Action.StudyReleased -> true
    is NextStepCard.Action.ReadWords,
    NextStepCard.Action.StartReviews,
    is NextStepCard.Action.Study,
    NextStepCard.Action.GoToReport,
    -> false
}

internal fun List<SchoolUiState.LessonCard>.featuredWith(selected: LessonId?): SchoolUiState.LessonCard? {
    val unstudied: List<SchoolUiState.LessonCard> = filter { card: SchoolUiState.LessonCard ->
        card.state != SchoolUiState.LessonState.Studied
    }
    return unstudied.firstOrNull { card: SchoolUiState.LessonCard -> card.lesson == selected }
        ?: unstudied.firstOrNull { card: SchoolUiState.LessonCard -> card.state == SchoolUiState.LessonState.Studying }
        ?: unstudied.firstOrNull { card: SchoolUiState.LessonCard -> card.state is SchoolUiState.LessonState.Open }
        ?: unstudied.firstOrNull()
}
