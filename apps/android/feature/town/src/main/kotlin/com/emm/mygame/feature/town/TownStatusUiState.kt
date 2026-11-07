package com.emm.mygame.feature.town

import com.emm.mygame.core.network.LessonId
import kotlin.time.Duration
import kotlin.time.Instant

data class TownStatusUiState(val running: RunningLesson?, val notice: FinishNotice?) {

    data class RunningLesson(val number: Int, val remaining: Duration, val finishesAt: Instant)

    data class FinishNotice(val number: Int, val firstUnread: LessonId?)

    companion object {
        val none: TownStatusUiState = TownStatusUiState(running = null, notice = null)
    }
}
