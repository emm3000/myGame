package com.emm.mygame.core.network

import com.emm.mygame.core.model.holdout.HoldoutCheck
import com.emm.mygame.core.model.learning.DueReviews
import com.emm.mygame.core.model.reminder.StudyAnswerSink
import com.emm.mygame.core.model.reminder.TownAnswerFreshness
import com.emm.mygame.core.model.report.TownReport
import com.emm.mygame.core.model.town.TownSnapshot
import java.util.concurrent.atomic.AtomicLong

class StudyAnswers(tokenStore: TokenStore, private val sink: StudyAnswerSink) {

    private val holding: Any = Any()

    private val sentRequests: AtomicLong = AtomicLong()

    private var lastForgottenOrder: Long = 0L

    private var lastTownSend: Long = 0L

    private var lastCardsSend: Long = 0L

    private var lastCheckSend: Long = 0L

    init {
        tokenStore.onSessionChange(::forget)
    }

    internal fun sending(): StudyRequest = StudyRequest(order = sentRequests.incrementAndGet())

    internal fun isNewest(request: StudyRequest): Boolean = request.order == sentRequests.get()

    internal fun townAnswered(request: StudyRequest, town: TownSnapshot) {
        synchronized(holding) {
            if (request.isForgotten() || request.wasSentBefore(lastTownSend)) return
            lastTownSend = request.order
            val freshness = TownAnswerFreshness(
                areCardsFresh = request.wasSentAfter(lastCardsSend),
                isCheckFresh = request.wasSentAfter(lastCheckSend),
            )
            lastCardsSend = maxOf(lastCardsSend, request.order)
            lastCheckSend = maxOf(lastCheckSend, request.order)
            sink.townAnswered(town, freshness)
        }
    }

    internal fun reviewsAnswered(request: StudyRequest, reviews: DueReviews) {
        synchronized(holding) {
            if (request.isForgotten() || request.wasSentBefore(lastCardsSend)) return
            lastCardsSend = request.order
            sink.reviewsAnswered(reviews)
        }
    }

    internal fun reportAnswered(request: StudyRequest, report: TownReport) {
        synchronized(holding) {
            if (request.isForgotten() || request.wasSentBefore(lastCardsSend)) return
            lastCardsSend = request.order
            sink.reportAnswered(report)
        }
    }

    internal fun holdoutChecksAnswered(request: StudyRequest, checks: List<HoldoutCheck>) {
        synchronized(holding) {
            if (request.isForgotten() || request.wasSentBefore(lastCheckSend)) return
            lastCheckSend = request.order
            sink.holdoutChecksAnswered(checks)
        }
    }

    private fun StudyRequest.isForgotten(): Boolean = !wasSentAfter(lastForgottenOrder)

    private fun forget() {
        synchronized(holding) {
            lastForgottenOrder = sentRequests.get()
            sink.sessionChanged()
        }
    }
}

@JvmInline
internal value class StudyRequest(val order: Long) {

    fun wasSentBefore(sendOrder: Long): Boolean = order < sendOrder

    fun wasSentAfter(sendOrder: Long): Boolean = order > sendOrder
}
