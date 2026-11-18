package com.emm.mygame.feature.school

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberUpdatedState
import com.emm.mygame.core.designsystem.MyGameDockGo
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.rememberPlayerCopy

@Composable
fun schoolStudyGo(state: SchoolUiState, number: Int, onIntent: (SchoolIntent) -> Unit): MyGameDockGo {
    val copy: PlayerCopy = rememberPlayerCopy()
    val waiting: String = copy.chrome(R.string.school_waiting).spoken
    val content: SchoolUiState.Content = state as? SchoolUiState.Content
        ?: return MyGameDockGo(
            label = copy.chrome(R.string.school_lesson_study, "number" to number.toString()),
            isBusy = true,
            busyDescription = waiting,
            onClick = {},
        )
    val card: SchoolUiState.LessonCard = content.lessons.firstOrNull { lesson: SchoolUiState.LessonCard ->
        lesson.number == number
    } ?: return unheldStudyGo(content, number, onIntent, copy, waiting)
    val block: SchoolUiState.LessonBlock? = (card.state as? SchoolUiState.LessonState.Open)?.block
    return MyGameDockGo(
        label = copy.studyLabelOf(card),
        isBusy = content.start == SchoolUiState.LessonRequest.Waiting,
        busyDescription = waiting,
        onClick = { onIntent(SchoolIntent.StudyTapped(card.lesson)) },
        blockedReason = block?.let { blocked: SchoolUiState.LessonBlock -> copy.blockLineOf(blocked).spoken },
    )
}

@Composable
private fun unheldStudyGo(
    content: SchoolUiState.Content,
    number: Int,
    onIntent: (SchoolIntent) -> Unit,
    copy: PlayerCopy,
    waiting: String,
): MyGameDockGo {
    val unheld: SchoolUiState.UnheldStep? = content.unheldStep?.takeIf { step: SchoolUiState.UnheldStep ->
        step.number == number
    }
    val currentOnIntent: (SchoolIntent) -> Unit by rememberUpdatedState(onIntent)
    if (unheld == null) LaunchedEffect(number) { currentOnIntent(SchoolIntent.DockStepUnheld(number)) }
    val reason: String = when (unheld) {
        is SchoolUiState.UnheldStep.Unheld -> copy.fixedCopy(R.string.school_refusal_unexpected)
        is SchoolUiState.UnheldStep.Reading, null -> copy.chrome(R.string.school_loading).spoken
    }
    return MyGameDockGo(
        label = copy.chrome(R.string.school_lesson_study, "number" to number.toString()),
        isBusy = false,
        busyDescription = waiting,
        onClick = {},
        blockedReason = reason,
    )
}
