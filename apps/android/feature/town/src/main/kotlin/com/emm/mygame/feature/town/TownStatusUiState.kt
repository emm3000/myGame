package com.emm.mygame.feature.town

import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.LessonName
import com.emm.mygame.core.network.NextStepCard
import com.emm.mygame.core.network.TownGoal
import kotlin.time.Duration
import kotlin.time.Instant

data class TownStatusUiState(val running: RunningLesson?, val notice: FinishNotice?, val dock: Dock? = null) {

    data class RunningLesson(val name: LessonName, val remaining: Duration, val finishesAt: Instant)

    data class FinishNotice(val name: LessonName, val firstUnread: LessonId?)

    sealed interface Dock {

        data object Loading : Dock

        data object Refused : Dock

        data class Step(
            val line: NextStepCard.Line,
            val detail: StepDetail?,
            val countdown: StepCountdown?,
            val go: Go,
            val lessonStart: TownUiState.LessonStartStatus,
            val capWait: CapWait?,
        ) : Dock
    }

    sealed interface StepDetail {

        data class Goal(val goal: TownGoal) : StepDetail
    }

    data class CapWait(val remaining: Duration, val dueAt: Instant)

    data class StepCountdown(
        val countdown: NextStepCard.Countdown.NextReview,
        val remaining: Duration,
        val finishesAt: Instant,
    )

    sealed interface Go {

        data class Acts(val action: NextStepCard.Action, val isBusy: Boolean) : Go

        data class ActsInPlace(val action: NextStepCard.Action.Study) : Go

        data class Blocked(val action: NextStepCard.Action, val reason: GoBlock) : Go
    }

    sealed interface GoBlock {

        data object NextReview : GoBlock

        data object NoReviewsDue : GoBlock

        data object Studying : GoBlock
    }

    companion object {
        val none: TownStatusUiState = TownStatusUiState(running = null, notice = null)
    }
}
