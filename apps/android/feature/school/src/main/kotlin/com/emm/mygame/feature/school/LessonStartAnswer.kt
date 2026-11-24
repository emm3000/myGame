package com.emm.mygame.feature.school

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.rememberPlayerCopy

@Composable
internal fun LessonStartAnswer(
    lesson: LessonId,
    start: SchoolUiState.LessonRequest,
    opening: SchoolUiState.CapOpening,
    modifier: Modifier = Modifier,
) {
    val copy: PlayerCopy = rememberPlayerCopy()
    val asked: LessonId? = when (start) {
        is SchoolUiState.LessonRequest.Refused -> start.lesson
        is SchoolUiState.LessonRequest.Unreachable -> start.lesson
        SchoolUiState.LessonRequest.Idle, SchoolUiState.LessonRequest.Waiting -> null
    }
    if (asked != lesson) return
    copy.requestAnswerOf(start, opening)?.let { line: String -> MyGameInlineAlert(message = line, modifier = modifier) }
}
