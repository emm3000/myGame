package com.emm.mygame

import com.emm.mygame.core.network.DueReviews
import com.emm.mygame.core.network.HoldoutCheck
import com.emm.mygame.core.network.NextStep
import com.emm.mygame.core.network.StudyAnswerSink
import com.emm.mygame.core.network.TownAnswerFreshness
import com.emm.mygame.core.network.TownReport
import com.emm.mygame.core.network.TownRepository
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.projection.StudyReminderFacts
import kotlin.time.Instant
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch

class StudyReminderFeed(
    private val store: StudyReminderStore,
    private val towns: () -> TownRepository,
    private val scope: CoroutineScope,
) : StudyAnswerSink {

    override fun townAnswered(town: TownSnapshot, freshness: TownAnswerFreshness) {
        val townCheckDue: Boolean = town.dueHoldoutChecks.isNotEmpty() || town.nextStep is NextStep.HoldoutCheck
        store.fold { facts: StudyReminderFacts ->
            val answered: StudyReminderFacts = facts.afterTownAnswer(
                readAt = town.readAt,
                isOnReviewsStep = town.nextStep is NextStep.Reviews,
                nextDueAt = town.nextDueAt,
                lessonFinishesAt = town.lessonSlot?.finishesAt,
                isCheckDue = if (freshness.isCheckFresh) townCheckDue else facts.isCheckDue,
                isLessonReady = town.nextStep is NextStep.LessonToStudy || town.nextStep is NextStep.ReleasedLesson,
            )
            if (freshness.areCardsFresh) answered else answered.withCardsOf(facts)
        }
    }

    override fun reviewsAnswered(reviews: DueReviews) {
        val hasDueCard: Boolean = reviews.due.isNotEmpty()
        store.fold { facts: StudyReminderFacts ->
            facts.afterReviewsOrReportAnswer(reviews.readAt, hasDueCard, reviews.nextDueAt)
        }
        if (!hasDueCard) askTownWhileOn()
    }

    override fun reportAnswered(report: TownReport, arrivedAt: Instant) {
        val hasDueCard: Boolean = report.dueCount > 0
        store.fold { facts: StudyReminderFacts ->
            facts.afterReviewsOrReportAnswer(arrivedAt, hasDueCard, report.nextDueAt)
        }
        if (!hasDueCard) askTownWhileOn()
    }

    override fun holdoutChecksAnswered(checks: List<HoldoutCheck>) {
        val holdsCheck: Boolean = checks.isNotEmpty()
        store.fold { facts: StudyReminderFacts -> facts.afterHoldoutChecksAnswer(holdsCheck) }
        if (!holdsCheck) askTownWhileOn()
    }

    override fun sessionChanged() {
        store.clear()
    }

    private fun askTownWhileOn() {
        if (!store.choice.value.isOn) return
        scope.launch { towns().read() }
    }
}

private fun StudyReminderFacts.withCardsOf(stored: StudyReminderFacts): StudyReminderFacts =
    copy(cardsWaitingFrom = stored.cardsWaitingFrom, lessonFinishingAt = stored.lessonFinishingAt)
