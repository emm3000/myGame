package com.emm.mygame.core.testing

import com.emm.mygame.core.network.DueReviews
import com.emm.mygame.core.network.HoldoutCheck
import com.emm.mygame.core.network.TownAnswerFreshness
import com.emm.mygame.core.network.TownReport
import com.emm.mygame.core.network.TownSnapshot
import kotlin.time.Instant

sealed interface StudyAnswer {

    data class Town(val town: TownSnapshot, val freshness: TownAnswerFreshness) : StudyAnswer

    data class Reviews(val reviews: DueReviews) : StudyAnswer

    data class Report(val report: TownReport, val arrivedAt: Instant) : StudyAnswer

    data class HoldoutChecks(val checks: List<HoldoutCheck>) : StudyAnswer

    data object SessionChanged : StudyAnswer
}
