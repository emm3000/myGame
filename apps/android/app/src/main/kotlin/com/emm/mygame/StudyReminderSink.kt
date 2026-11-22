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

class StudyReminderSink(
    private val store: Lazy<StudyReminderStore>,
    private val towns: () -> TownRepository,
    private val scope: CoroutineScope,
) : StudyAnswerSink {

    private val holding: Any = Any()

    private var lastCardsRead: CardsRead? = null

    override fun townAnswered(town: TownSnapshot, freshness: TownAnswerFreshness) {
        val townCheckDue: Boolean = town.dueHoldoutChecks.isNotEmpty() || town.nextStep is NextStep.HoldoutCheck
        synchronized(holding) {
            val newerCardsRead: CardsRead? = lastCardsRead.takeUnless { freshness.areCardsFresh }
            store.value.fold { facts: StudyReminderFacts ->
                facts.afterTownAnswer(
                    readAt = town.readAt,
                    isOnReviewsStep = town.nextStep is NextStep.Reviews,
                    nextDueAt = town.nextDueAt,
                    lessonFinishesAt = town.lessonSlot?.finishesAt,
                    isCheckDue = if (freshness.isCheckFresh) townCheckDue else facts.isCheckDue,
                    isLessonReady = town.nextStep is NextStep.LessonToStudy || town.nextStep is NextStep.ReleasedLesson,
                ).afterCardsRead(newerCardsRead)
            }
        }
    }

    override fun reviewsAnswered(reviews: DueReviews) {
        cardsAnswered(
            CardsRead(readAt = reviews.readAt, hasDueCard = reviews.due.isNotEmpty(), nextDueAt = reviews.nextDueAt),
        )
    }

    override fun reportAnswered(report: TownReport) {
        cardsAnswered(CardsRead(readAt = report.readAt, hasDueCard = report.dueCount > 0, nextDueAt = report.nextDueAt))
    }

    override fun holdoutChecksAnswered(checks: List<HoldoutCheck>) {
        val holdsCheck: Boolean = checks.isNotEmpty()
        store.value.fold { facts: StudyReminderFacts -> facts.afterHoldoutChecksAnswer(holdsCheck) }
        if (!holdsCheck) askTownWhileOn()
    }

    override fun sessionChanged() {
        synchronized(holding) {
            lastCardsRead = null
            store.value.clear()
        }
    }

    private fun cardsAnswered(read: CardsRead) {
        synchronized(holding) {
            lastCardsRead = read
            store.value.fold { facts: StudyReminderFacts -> facts.afterCardsRead(read) }
        }
        if (!read.hasDueCard) askTownWhileOn()
    }

    private fun askTownWhileOn() {
        if (!store.value.choice.value.isOn) return
        scope.launch { towns().read() }
    }
}

private data class CardsRead(val readAt: Instant, val hasDueCard: Boolean, val nextDueAt: Instant?)

private fun StudyReminderFacts.afterCardsRead(read: CardsRead?): StudyReminderFacts =
    read?.let { afterReviewsOrReportAnswer(it.readAt, it.hasDueCard, it.nextDueAt) } ?: this
