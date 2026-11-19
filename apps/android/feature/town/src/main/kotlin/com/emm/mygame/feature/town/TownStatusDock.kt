package com.emm.mygame.feature.town

import com.emm.mygame.core.network.NextStep
import com.emm.mygame.core.network.NextStepCard
import com.emm.mygame.core.network.TownGoal
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.network.capWaitsUntil
import com.emm.mygame.core.network.nextStepCard
import com.emm.mygame.core.projection.countdownTo
import kotlin.time.Duration
import kotlin.time.Instant

internal fun TownSnapshot.dockOn(
    screen: TownStatusScreen,
    now: Instant,
    gap: Duration,
    lessonStart: TownUiState.LessonStartStatus,
): TownStatusUiState.Dock.Step {
    val card: NextStepCard = nextStepCard()
    return TownStatusUiState.Dock.Step(
        line = card.line,
        detail = caughtUpGoal()?.let(TownStatusUiState.StepDetail::Goal),
        countdown = card.countdown?.let { countdown: NextStepCard.Countdown -> countdown.timeAt(now, gap) },
        go = card.goOn(screen, lessonStart),
        lessonStart = lessonStart,
        capWait = capWaitsUntil(now)?.let { dueAt: Instant ->
            TownStatusUiState.CapWait(remaining = dueAt - now, dueAt = dueAt - gap)
        },
    )
}

private fun TownSnapshot.caughtUpGoal(): TownGoal? = (nextStep as? NextStep.CaughtUp)?.goal

private fun NextStepCard.goOn(
    screen: TownStatusScreen,
    lessonStart: TownUiState.LessonStartStatus,
): TownStatusUiState.Go {
    val cardAction: NextStepCard.Action = action
    return when {
        screen == TownStatusScreen.Report && cardAction == NextStepCard.Action.GoToReport ->
            TownStatusUiState.Go.Blocked(cardAction, reason = reportWait())
        screen == TownStatusScreen.School && cardAction is NextStepCard.Action.Study ->
            TownStatusUiState.Go.ActsInPlace(cardAction)
        screen == TownStatusScreen.School && cardAction == NextStepCard.Action.ReadWords(lesson = null) ->
            TownStatusUiState.Go.Blocked(cardAction, reason = TownStatusUiState.GoBlock.Studying)
        else -> TownStatusUiState.Go.Acts(cardAction, isBusy = cardAction.isWaitingOn(lessonStart))
    }
}

private fun NextStepCard.Action.isWaitingOn(lessonStart: TownUiState.LessonStartStatus): Boolean =
    this is NextStepCard.Action.StudyReleased && lessonStart == TownUiState.LessonStartStatus.Waiting

private fun NextStepCard.reportWait(): TownStatusUiState.GoBlock =
    if (countdown is NextStepCard.Countdown.NextReview) {
        TownStatusUiState.GoBlock.NextReview
    } else {
        TownStatusUiState.GoBlock.NoReviewsDue
    }

private fun NextStepCard.Countdown.timeAt(now: Instant, gap: Duration): TownStatusUiState.StepCountdown =
    TownStatusUiState.StepCountdown(
        countdown = this,
        remaining = countdownTo(finishesAt = at, now = now),
        finishesAt = at - gap,
    )
