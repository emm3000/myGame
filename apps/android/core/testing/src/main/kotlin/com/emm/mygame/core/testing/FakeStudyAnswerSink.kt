package com.emm.mygame.core.testing

import com.emm.mygame.core.network.DueReviews
import com.emm.mygame.core.network.HoldoutCheck
import com.emm.mygame.core.network.StudyAnswerSink
import com.emm.mygame.core.network.TownAnswerFreshness
import com.emm.mygame.core.network.TownReport
import com.emm.mygame.core.network.TownSnapshot
import java.util.concurrent.CopyOnWriteArrayList

class FakeStudyAnswerSink : StudyAnswerSink {

    private val _answers: MutableList<StudyAnswer> = CopyOnWriteArrayList()

    val answers: List<StudyAnswer>
        get() = _answers.toList()

    override fun townAnswered(town: TownSnapshot, freshness: TownAnswerFreshness) {
        _answers += StudyAnswer.Town(town, freshness)
    }

    override fun reviewsAnswered(reviews: DueReviews) {
        _answers += StudyAnswer.Reviews(reviews)
    }

    override fun reportAnswered(report: TownReport) {
        _answers += StudyAnswer.Report(report)
    }

    override fun holdoutChecksAnswered(checks: List<HoldoutCheck>) {
        _answers += StudyAnswer.HoldoutChecks(checks)
    }

    override fun sessionChanged() {
        _answers += StudyAnswer.SessionChanged
    }
}
