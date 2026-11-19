package com.emm.mygame.feature.town

import androidx.compose.runtime.Composable
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.rememberPlayerCopy

class TownNotice(val message: String, val key: Any)

@Composable
fun TownStatusUiState.Dock.shownNotice(): TownNotice? {
    val copy: PlayerCopy = rememberPlayerCopy()
    return when (this) {
        TownStatusUiState.Dock.Loading -> null
        TownStatusUiState.Dock.Refused ->
            TownNotice(message = copy.fixedCopy(R.string.town_refusal_unexpected), key = this)
        is TownStatusUiState.Dock.Step -> copy.lessonStartNoticeOf(this)
    }
}

private fun PlayerCopy.lessonStartNoticeOf(step: TownStatusUiState.Dock.Step): TownNotice? =
    when (val start: TownUiState.LessonStartStatus = step.lessonStart) {
        is TownUiState.LessonStartStatus.Refused ->
            TownNotice(message = fixedCopy { lessonRefusalLineOf(start.refusal, step.capWait) }, key = start)
        TownUiState.LessonStartStatus.Unreachable ->
            TownNotice(message = fixedCopy(R.string.town_refusal_unexpected), key = start)
        TownUiState.LessonStartStatus.Idle, TownUiState.LessonStartStatus.Waiting -> null
    }
