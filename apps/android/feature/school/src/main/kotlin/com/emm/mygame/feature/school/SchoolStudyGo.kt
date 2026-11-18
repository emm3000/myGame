package com.emm.mygame.feature.school

import androidx.compose.runtime.Composable
import com.emm.mygame.core.designsystem.MyGameDockGo
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.rememberPlayerCopy

@Composable
fun schoolStudyGo(state: SchoolUiState, number: Int, onIntent: (SchoolIntent) -> Unit): MyGameDockGo? {
    val copy: PlayerCopy = rememberPlayerCopy()
    val content: SchoolUiState.Content = state as? SchoolUiState.Content ?: return null
    val card: SchoolUiState.LessonCard =
        content.lessons.firstOrNull { lesson: SchoolUiState.LessonCard -> lesson.number == number } ?: return null
    val block: SchoolUiState.LessonBlock? = (card.state as? SchoolUiState.LessonState.Open)?.block
    return MyGameDockGo(
        label = copy.studyLabelOf(card),
        isBusy = content.start == SchoolUiState.LessonRequest.Waiting,
        busyDescription = copy.chrome(R.string.school_waiting).spoken,
        onClick = { onIntent(SchoolIntent.StudyTapped(card.lesson)) },
        blockedReason = block?.let { blocked: SchoolUiState.LessonBlock -> copy.blockLineOf(blocked).spoken },
    )
}
