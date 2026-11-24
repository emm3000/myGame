package com.emm.mygame.core.testing

import com.emm.mygame.core.model.holdout.HoldoutCheck
import com.emm.mygame.core.model.learning.DueReviews
import com.emm.mygame.core.model.report.TownReport
import com.emm.mygame.core.network.TownAnswerFreshness
import com.emm.mygame.core.network.TownSnapshot

sealed interface StudyAnswer {

    data class Town(val town: TownSnapshot, val freshness: TownAnswerFreshness) : StudyAnswer

    data class Reviews(val reviews: DueReviews) : StudyAnswer

    data class Report(val report: TownReport) : StudyAnswer

    data class HoldoutChecks(val checks: List<HoldoutCheck>) : StudyAnswer

    data object SessionChanged : StudyAnswer
}
