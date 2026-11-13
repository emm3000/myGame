package com.emm.mygame.feature.town

import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.TownLessonResult
import com.emm.mygame.core.network.TownRepository
import com.emm.mygame.core.network.TownSnapshot
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch

internal class TownLessonStart(
    private val towns: TownRepository,
    private val scope: CoroutineScope,
    private val mutations: () -> TownMutations,
    private val onDrawn: (TownMutations) -> Unit,
    private val onAnswered: (TownSnapshot, TownMutations) -> Unit,
) {

    fun start(lesson: LessonId) {
        if (mutations().lessonStart == TownUiState.LessonStartStatus.Waiting) return
        onDrawn(mutations().copy(lessonStart = TownUiState.LessonStartStatus.Waiting))
        scope.launch {
            when (val answer: TownLessonResult = towns.startLesson(lesson)) {
                is TownLessonResult.Answered -> onAnswered(answer.town, mutations().lessonStartAnswered())
                is TownLessonResult.Refused ->
                    onDrawn(mutations().copy(lessonStart = TownUiState.LessonStartStatus.Refused(answer.refusal)))
                TownLessonResult.Unreachable ->
                    onDrawn(mutations().copy(lessonStart = TownUiState.LessonStartStatus.Unreachable))
            }
        }
    }
}
