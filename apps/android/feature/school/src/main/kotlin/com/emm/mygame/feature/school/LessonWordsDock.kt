package com.emm.mygame.feature.school

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.relocation.BringIntoViewRequester
import androidx.compose.foundation.relocation.bringIntoViewRequester
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.MyGameCountdownGround
import com.emm.mygame.core.designsystem.MyGameCountdownLine
import com.emm.mygame.core.designsystem.MyGameDockGo
import com.emm.mygame.core.designsystem.MyGameDockLine
import com.emm.mygame.core.designsystem.MyGameDockLineText
import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.ui.FillTaskDock
import com.emm.mygame.core.ui.FollowTownDock
import com.emm.mygame.core.ui.TaskDock
import com.emm.mygame.core.ui.TaskDockHook
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.rememberPlayerCopy
import kotlin.time.Duration

@Composable
internal fun LessonWordsDock(
    state: LessonWordsUiState,
    onIntent: (LessonWordsIntent) -> Unit,
    onWayOn: (LessonWordsUiState.WayOn) -> Unit,
    task: TaskDockHook,
) {
    when {
        state == LessonWordsUiState.Loading -> Unit
        state.isFollowingTown -> FollowTownDock(hook = task)
        state is LessonWordsUiState.Reading -> FillTaskDock(hook = task, dock = readingDock(state, onIntent, onWayOn))
    }
}

@Composable
internal fun FoldedReadingLine(reading: LessonWordsUiState.Reading, modifier: Modifier = Modifier) {
    val requester: BringIntoViewRequester = remember { BringIntoViewRequester() }
    LaunchedEffect(reading.index, reading.isWaitingForLessonEnd) { requester.bringIntoView() }
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
        modifier = modifier.bringIntoViewRequester(requester),
    ) {
        MyGameDockLineText(line = readingLineOf(reading), loadingLabel = waitingLabel())
        WaitingTime(reading = reading)
    }
}

@Composable
private fun readingDock(
    reading: LessonWordsUiState.Reading,
    onIntent: (LessonWordsIntent) -> Unit,
    onWayOn: (LessonWordsUiState.WayOn) -> Unit,
): TaskDock = TaskDock(
    line = readingLineOf(reading),
    go = readingGoOf(reading, onIntent, onWayOn),
    notice = { WaitingTime(reading = reading) },
)

@Composable
private fun readingLineOf(reading: LessonWordsUiState.Reading): MyGameDockLine = MyGameDockLine(
    title = rememberPlayerCopy().lessonTitleOf(reading.name),
    step = chromeResource(
        R.string.school_lesson_word_position,
        "number" to (reading.index + 1).toString(),
        "count" to reading.words.size.toString(),
    ),
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
            blockedReason = chromeResource(R.string.school_lesson_word_then).spoken,
        ) {}
    }
}

@Composable
internal fun wayOnLabelOf(wayOn: LessonWordsUiState.WayOn): MyGameLabel = when (wayOn) {
    is LessonWordsUiState.WayOn.Lesson -> chromeResource(R.string.school_lesson_next)
    LessonWordsUiState.WayOn.Reviews -> chromeResource(R.string.school_start_reviews)
}

@Composable
private fun goOf(label: MyGameLabel, blockedReason: String? = null, onClick: () -> Unit): MyGameDockGo = MyGameDockGo(
    label = label,
    isBusy = false,
    busyDescription = waitingLabel(),
    onClick = onClick,
    blockedReason = blockedReason,
)

@Composable
private fun WaitingTime(reading: LessonWordsUiState.Reading, modifier: Modifier = Modifier) {
    val remaining: Duration = reading.remaining?.takeIf { reading.isWaitingForLessonEnd } ?: return
    MyGameCountdownLine(
        words = chromeResource(R.string.school_slot_title),
        time = rememberPlayerCopy().chrome { timeLeftLabelOf(remaining) },
        ground = MyGameCountdownGround.Paper,
        modifier = modifier,
    )
}

@Composable
private fun waitingLabel(): String = chromeResource(R.string.school_waiting).spoken
