package com.emm.mygame.core.network

import java.util.concurrent.atomic.AtomicLong
import kotlin.time.Clock

class StudyAnswers(tokenStore: TokenStore, private val sink: StudyAnswerSink, private val clock: Clock) {

    private val holding: Any = Any()

    private val sentRequests: AtomicLong = AtomicLong()

    private var lastForgottenOrder: Long = 0L

    private var townDecidedBy: Long = 0L

    private var cardsDecidedBy: Long = 0L

    private var checkDecidedBy: Long = 0L

    init {
        tokenStore.onSessionChange(::forget)
    }

    internal fun sending(): StudyRequest = StudyRequest(order = sentRequests.incrementAndGet())

    internal fun townAnswered(request: StudyRequest, town: TownSnapshot) {
        synchronized(holding) {
            if (request.isForgotten() || request.order < townDecidedBy) return
            townDecidedBy = request.order
            val freshness = TownAnswerFreshness(
                areCardsFresh = request.order > cardsDecidedBy,
                isCheckFresh = request.order > checkDecidedBy,
            )
            cardsDecidedBy = maxOf(cardsDecidedBy, request.order)
            checkDecidedBy = maxOf(checkDecidedBy, request.order)
            sink.townAnswered(town, freshness)
        }
    }

    internal fun reviewsAnswered(request: StudyRequest, reviews: DueReviews) {
        synchronized(holding) {
            if (request.isForgotten() || request.order < cardsDecidedBy) return
            cardsDecidedBy = request.order
            sink.reviewsAnswered(reviews)
        }
    }

    internal fun reportAnswered(request: StudyRequest, report: TownReport) {
        synchronized(holding) {
            if (request.isForgotten() || request.order < cardsDecidedBy) return
            cardsDecidedBy = request.order
            sink.reportAnswered(report, arrivedAt = clock.now())
        }
    }

    internal fun holdoutChecksAnswered(request: StudyRequest, checks: List<HoldoutCheck>) {
        synchronized(holding) {
            if (request.isForgotten() || request.order < checkDecidedBy) return
            checkDecidedBy = request.order
            sink.holdoutChecksAnswered(checks)
        }
    }

    private fun StudyRequest.isForgotten(): Boolean = order <= lastForgottenOrder

    private fun forget() {
        synchronized(holding) {
            lastForgottenOrder = sentRequests.get()
            sink.sessionChanged()
        }
    }
}

@JvmInline
internal value class StudyRequest(val order: Long)
