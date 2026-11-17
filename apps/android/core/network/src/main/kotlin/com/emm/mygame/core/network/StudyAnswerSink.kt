package com.emm.mygame.core.network

import kotlin.time.Instant

interface StudyAnswerSink {

    fun townAnswered(town: TownSnapshot, freshness: TownAnswerFreshness)

    fun reviewsAnswered(reviews: DueReviews)

    fun reportAnswered(report: TownReport, arrivedAt: Instant)

    fun holdoutChecksAnswered(checks: List<HoldoutCheck>)

    fun sessionChanged()
}
