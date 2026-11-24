package com.emm.mygame.core.network

import com.emm.mygame.core.model.holdout.HoldoutCheck
import com.emm.mygame.core.model.learning.DueReviews
import com.emm.mygame.core.model.report.TownReport

interface StudyAnswerSink {

    fun townAnswered(town: TownSnapshot, freshness: TownAnswerFreshness)

    fun reviewsAnswered(reviews: DueReviews)

    fun reportAnswered(report: TownReport)

    fun holdoutChecksAnswered(checks: List<HoldoutCheck>)

    fun sessionChanged()
}
