package com.emm.mygame.feature.today

import com.emm.mygame.core.model.holdout.HoldoutCheckWeek
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.placement.PlacementBand
import com.emm.mygame.core.model.town.LessonName
import com.emm.mygame.core.model.town.school.TownLessonRefusal
import kotlin.time.Duration
import kotlin.time.Instant

sealed interface TodayUiState {

    data object Loading : TodayUiState

    data object Failed : TodayUiState

    data class Content(
        val eyebrow: Eyebrow,
        val first: FirstCard?,
        val running: RunningLesson?,
        val start: StartStatus,
    ) : TodayUiState

    enum class Eyebrow { StartHere, WhatIsNext }

    sealed interface FirstCard {

        data class Study(val lesson: LessonId, val number: Int) : FirstCard

        data class StudyReleased(val lesson: LessonId, val band: PlacementBand, val position: Int) : FirstCard

        data class Reviews(val count: Int, val readFirst: LessonId?) : FirstCard

        data class HoldoutCheck(val band: PlacementBand, val week: HoldoutCheckWeek) : FirstCard

        data class CaughtUp(val line: CaughtUpLine, val nextReview: TimeAt?) : FirstCard
    }

    sealed interface CaughtUpLine {

        data object NoReviewsDue : CaughtUpLine

        data class LearningCap(val inLearning: Int, val cap: Int) : CaughtUpLine
    }

    data class TimeAt(val remaining: Duration, val at: Instant)

    data class RunningLesson(
        val lesson: LessonId,
        val name: LessonName,
        val remaining: Duration,
        val finishesAt: Instant,
    )

    sealed interface StartStatus {

        data object Idle : StartStatus

        data object Starting : StartStatus

        data class Refused(val refusal: TownLessonRefusal) : StartStatus

        data object Unreachable : StartStatus
    }
}
