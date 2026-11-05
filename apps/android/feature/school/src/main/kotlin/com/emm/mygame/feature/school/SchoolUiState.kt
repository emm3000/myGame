package com.emm.mygame.feature.school

import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.TownLessonRefusal
import com.emm.mygame.core.network.TownResourceKind
import kotlin.time.Duration

sealed interface SchoolUiState {

    data object Loading : SchoolUiState

    data object Failed : SchoolUiState

    data class Content(
        val schoolLevel: Int,
        val learning: LearningLine,
        val slot: SlotLine,
        val skills: List<SkillLine>,
        val lessons: List<LessonCard>,
        val start: LessonRequest,
        val stop: LessonRequest,
    ) : SchoolUiState

    data class LearningLine(val inLearning: Int, val cap: Int, val wordsPastCap: Int?)

    sealed interface SlotLine {

        data object Idle : SlotLine

        data class Busy(
            val lesson: LessonId,
            val number: Int,
            val remaining: Duration,
            val total: Duration,
        ) : SlotLine

        data class Done(val number: Int) : SlotLine
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
        val state: LessonState,
    )

    sealed interface LessonState {

        data object Studied : LessonState

        data object Studying : LessonState

        data class Open(val block: LessonBlock?) : LessonState
    }

    sealed interface LessonBlock {

        data class SlotBusy(val number: Int) : LessonBlock

        data class SchoolTooLow(val requiredLevel: Int) : LessonBlock

        data class CapReached(val inLearning: Int, val cap: Int, val wordCount: Int) : LessonBlock
    }

    sealed interface LessonRequest {

        data object Idle : LessonRequest

        data object Waiting : LessonRequest

        data class Refused(val lesson: LessonId, val refusal: TownLessonRefusal) : LessonRequest

        data class Unreachable(val lesson: LessonId) : LessonRequest
    }
}
