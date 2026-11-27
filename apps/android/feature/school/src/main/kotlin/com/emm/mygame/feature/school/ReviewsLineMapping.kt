package com.emm.mygame.feature.school

import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.guidance.NextStep
import kotlin.time.Duration
import kotlin.time.Instant

internal fun TownSnapshot.reviewsLineAt(now: Instant, gap: Duration): SchoolUiState.ReviewsLine? =
    when (val step: NextStep = nextStep) {
        is NextStep.Reviews -> SchoolUiState.ReviewsLine.Due(step.count, step.readFirst.firstOrNull())
        is NextStep.HoldoutCheck -> noneDueAt(now, gap).takeUnless { isReviewDueAt(now) }
        is NextStep.LessonRunning,
        is NextStep.ReleasedLesson,
        is NextStep.LessonToStudy,
        is NextStep.CaughtUp,
        -> noneDueAt(now, gap)
    }

private fun TownSnapshot.noneDueAt(now: Instant, gap: Duration): SchoolUiState.ReviewsLine.NoneDue =
    SchoolUiState.ReviewsLine.NoneDue(nextReviewAt(now, gap))

private fun TownSnapshot.isReviewDueAt(now: Instant): Boolean {
    val dueAt: Instant = nextDueAt ?: return false
    return dueAt <= now
}

private fun TownSnapshot.nextReviewAt(now: Instant, gap: Duration): SchoolUiState.NextReview? {
    val dueAt: Instant = nextDueAt?.takeIf { instant: Instant -> instant > now } ?: return null
    return SchoolUiState.NextReview(remaining = dueAt - now, at = dueAt - gap)
}
