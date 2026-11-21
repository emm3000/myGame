package com.emm.mygame.core.network

interface StudyAnswerSink {

    fun townAnswered(town: TownSnapshot, freshness: TownAnswerFreshness)

    fun reviewsAnswered(reviews: DueReviews)

    fun reportAnswered(report: TownReport)

    fun holdoutChecksAnswered(checks: List<HoldoutCheck>)

    fun sessionChanged()
}
