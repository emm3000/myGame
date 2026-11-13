package com.emm.mygame.feature.town

import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.LessonName
import kotlin.time.Duration
import kotlin.time.Instant

data class TownStatusUiState(val running: RunningLesson?, val notice: FinishNotice?) {

    data class RunningLesson(val name: LessonName, val remaining: Duration, val finishesAt: Instant)

    data class FinishNotice(val name: LessonName, val firstUnread: LessonId?)

    companion object {
        val none: TownStatusUiState = TownStatusUiState(running = null, notice = null)
    }
}
