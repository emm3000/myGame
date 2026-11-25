package com.emm.mygame.feature.school.words

import androidx.compose.runtime.Composable
import com.emm.mygame.core.designsystem.MyGameDockGo
import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.ui.FillTaskDock
import com.emm.mygame.core.ui.FollowTownDock
import com.emm.mygame.core.ui.TaskDock
import com.emm.mygame.core.ui.TaskDockHook
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.feature.school.R

@Composable
internal fun LessonWordsDock(
    state: LessonWordsUiState,
    onIntent: (LessonWordsIntent) -> Unit,
    onWayOn: (LessonWordsUiState.WayOn) -> Unit,
    task: TaskDockHook,
) {
    when (state) {
        LessonWordsUiState.Loading -> Unit
        LessonWordsUiState.Failed, LessonWordsUiState.NothingToRead -> FollowTownDock(hook = task)
        is LessonWordsUiState.Reading ->
            ReadingDock(reading = state, onIntent = onIntent, onWayOn = onWayOn, task = task)
    }
}

@Composable
private fun ReadingDock(
    reading: LessonWordsUiState.Reading,
    onIntent: (LessonWordsIntent) -> Unit,
    onWayOn: (LessonWordsUiState.WayOn) -> Unit,
    task: TaskDockHook,
) {
    if (reading.isFollowingTown) return FollowTownDock(hook = task)
    FillTaskDock(hook = task, dock = readingDock(reading, onIntent, onWayOn))
}

@Composable
private fun readingDock(
    reading: LessonWordsUiState.Reading,
    onIntent: (LessonWordsIntent) -> Unit,
    onWayOn: (LessonWordsUiState.WayOn) -> Unit,
): TaskDock = TaskDock(
    step = chromeResource(
        R.string.school_lesson_word_position,
        "number" to (reading.index + 1).toString(),
        "count" to reading.words.size.toString(),
    ),
    go = readingGoOf(reading, onIntent, onWayOn),
)

@Composable
private fun readingGoOf(
    reading: LessonWordsUiState.Reading,
    onIntent: (LessonWordsIntent) -> Unit,
    onWayOn: (LessonWordsUiState.WayOn) -> Unit,
): MyGameDockGo {
    val wayOn: LessonWordsUiState.WayOn? = reading.wayOn
    return when {
        !reading.isLastWord -> goOf(chromeResource(R.string.school_lesson_word_next)) {
            onIntent(LessonWordsIntent.NextWordTapped)
        }
        wayOn != null -> goOf(wayOnLabelOf(wayOn)) { onWayOn(wayOn) }
        else -> goOf(
            label = chromeResource(R.string.school_start_reviews),
            blockedReason = chromeResource(R.string.school_lesson_word_then),
        ) {}
    }
}

@Composable
private fun goOf(
    label: MyGameLabel,
    blockedReason: MyGameLabel? = null,
    onClick: () -> Unit,
): MyGameDockGo = MyGameDockGo(
    label = label,
    isBusy = false,
    busyDescription = waitingLabel(),
    onClick = onClick,
    blockedReason = blockedReason,
)

@Composable
private fun waitingLabel(): MyGameLabel = chromeResource(R.string.school_waiting)
