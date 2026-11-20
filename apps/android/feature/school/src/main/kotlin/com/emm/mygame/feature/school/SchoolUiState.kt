package com.emm.mygame.feature.school

import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.LessonName
import com.emm.mygame.core.network.NextStepCard
import com.emm.mygame.core.network.SchoolPathCounts
import com.emm.mygame.core.network.SeasonKind
import com.emm.mygame.core.network.TextId
import com.emm.mygame.core.network.TownLessonRefusal
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSnapshot
import kotlin.time.Duration
import kotlin.time.Instant

sealed interface SchoolUiState {

    data object Loading : SchoolUiState

    data object Failed : SchoolUiState

    data class Content(
        val schoolLevel: Int,
        val learning: LearningLine,
        val slot: SlotLine,
        val skills: List<SkillLine>,
        val lessons: List<LessonCard>,
        val releasedLessons: List<ReleasedLessonCard>,
        val texts: List<TextCard>,
        val studyMark: DurationMark?,
        val nextStep: NextStepCard,
        val start: LessonRequest,
        val stop: LessonRequest,
        val isHoldoutNoteShown: Boolean,
        val bandLines: List<TownSnapshot.BandLine>,
        val selected: LessonId? = null,
    ) : SchoolUiState {

        val shown: LessonCard?
            get() {
                val unstudied: List<LessonCard> = lessons.filter { card: LessonCard ->
                    card.state != LessonState.Studied
                }
                return unstudied.firstOrNull { card: LessonCard -> card.lesson == selected }
                    ?: unstudied.firstOrNull { card: LessonCard -> card.state is LessonState.Open }
                    ?: unstudied.firstOrNull()
            }

        val isNextStepAhead: Boolean
            get() = selected == null && nextStep.action.isAheadOfTheShelf()

        val blockLesson: LessonCard?
            get() = shown.takeUnless { isNextStepAhead }

        val nextStepReleasedLesson: LessonId?
            get() = (nextStep.action as? NextStepCard.Action.StudyReleased)?.lesson?.takeIf { blockLesson == null }

        fun isStepLesson(card: LessonCard): Boolean =
            (nextStep.action as? NextStepCard.Action.Study)?.number == card.number
    }

    data class TextCard(val text: TextId, val title: String)

    data class DurationMark(val season: SeasonKind, val percent: Int)

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

        data class SlotBusy(val name: LessonName) : LessonBlock

        data class SchoolTooLow(val requiredLevel: Int) : LessonBlock

        data object CapReached : LessonBlock
    }

    sealed interface LessonRequest {

        data object Idle : LessonRequest

        data object Waiting : LessonRequest

        data class Refused(val lesson: LessonId, val refusal: TownLessonRefusal) : LessonRequest

        data class Unreachable(val lesson: LessonId) : LessonRequest
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
