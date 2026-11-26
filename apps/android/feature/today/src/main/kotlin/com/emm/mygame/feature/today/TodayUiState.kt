package com.emm.mygame.feature.today

import com.emm.mygame.core.model.holdout.HoldoutCheckWeek
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.placement.PlacementBand
import com.emm.mygame.core.model.town.LessonName
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.news.TownNews
import com.emm.mygame.core.model.town.school.TownLessonRefusal
import com.emm.mygame.core.projection.town.building.BlockReason
import com.emm.mygame.core.projection.town.building.NextLevelLine
import com.emm.mygame.core.projection.town.building.StartStatus
import kotlin.time.Duration
import kotlin.time.Instant

sealed interface TodayUiState {

    data object Loading : TodayUiState

    data object Failed : TodayUiState

    data class Content(
        val eyebrow: Eyebrow,
        val first: FirstCard?,
        val gained: List<TownSnapshot.Cost>,
        val whatHappened: WhatHappened?,
        val lesson: RunningLesson?,
        val work: RunningWork?,
        val job: JobOut?,
        val canDo: List<CanDo>,
        val locked: List<Locked>,
        val start: LessonStart,
        val build: StartStatus,
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

    data class WhatHappened(val events: List<NewsEvent>, val receivedAt: Instant, val close: NewsClose)

    sealed interface NewsEvent {

        val news: TownNews

        data class Achievement(override val news: TownNews) : NewsEvent

        data class Plain(override val news: TownNews) : NewsEvent
    }

    sealed interface NewsClose {

        data object Idle : NewsClose

        data object Waiting : NewsClose

        data object Unreachable : NewsClose
    }

    data class TimeAt(val remaining: Duration, val at: Instant)

    data class RunningLesson(
        val lesson: LessonId,
        val name: LessonName,
        val remaining: Duration,
        val finishesAt: Instant,
    )

    data class RunningWork(
        val building: TownBuildingKind,
        val level: Int,
        val remaining: Duration,
        val finishesAt: Instant,
    )

    data class CanDo(val building: TownBuildingKind, val next: NextLevelLine)

    data class Locked(val building: TownBuildingKind, val next: NextLevelLine, val block: BlockReason)

    data class JobOut(val phase: TownSnapshot.JobPhase, val remaining: Duration, val finishesAt: Instant)

    sealed interface LessonStart {

        data object Idle : LessonStart

        data object Starting : LessonStart

        data class Refused(val refusal: TownLessonRefusal) : LessonStart

        data object Unreachable : LessonStart
    }
}
