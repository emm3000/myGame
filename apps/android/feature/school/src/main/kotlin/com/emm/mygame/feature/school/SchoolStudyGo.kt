package com.emm.mygame.feature.school

import androidx.compose.runtime.Composable
import com.emm.mygame.core.designsystem.MyGameDockGo
import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.rememberPlayerCopy

@Composable
fun schoolStudyGo(
    state: SchoolUiState,
    held: TownSnapshot?,
    number: Int,
    onIntent: (SchoolIntent) -> Unit,
): MyGameDockGo {
    val copy: PlayerCopy = rememberPlayerCopy()
    val waiting: MyGameLabel = copy.chrome(R.string.school_waiting)
    val card: SchoolUiState.LessonCard = held?.cardOf(number)
        ?: return MyGameDockGo(
            label = copy.chrome(R.string.school_lesson_study, "number" to number.toString()),
            isBusy = true,
            busyDescription = waiting,
            onClick = {},
        )
    val block: SchoolUiState.LessonBlock? = (card.state as? SchoolUiState.LessonState.Open)?.block
    return MyGameDockGo(
        label = copy.studyLabelOf(card),
        isBusy = (state as? SchoolUiState.Content)?.start == SchoolUiState.LessonRequestStatus.Waiting,
        busyDescription = waiting,
        onClick = { onIntent(SchoolIntent.StudyTapped(card.lesson)) },
        blockedReason = block?.let { blocked: SchoolUiState.LessonBlock -> copy.blockLineOf(blocked) },
    )
}

private fun TownSnapshot.cardOf(number: Int): SchoolUiState.LessonCard? =
    lessons.getOrNull(number - 1)?.cardIn(this)
