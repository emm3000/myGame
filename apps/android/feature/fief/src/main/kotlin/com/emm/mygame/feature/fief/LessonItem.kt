package com.emm.mygame.feature.fief

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameButton
import com.emm.mygame.core.designsystem.MyGameIcon
import com.emm.mygame.core.designsystem.MyGameIcons
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTextLink
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.ui.icuStringResource

@Composable
internal fun LessonItem(
    card: FiefUiState.LessonCard,
    isWaiting: Boolean,
    onIntent: (FiefIntent) -> Unit,
    onReviewOpen: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Card(modifier = modifier) {
        Column(
            verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
            modifier = Modifier.padding(vertical = MyGameSpacing.step3),
        ) {
            MyGameText(
                text = stringResource(R.string.lesson_title),
                style = MyGameTypography.brand,
                color = MyGameTheme.colors.ink,
                modifier = Modifier.semantics { heading() },
            )
            MyGameText(text = card.theme, style = MyGameTypography.label, color = MyGameTheme.colors.inkMuted)
            when (val line: FiefUiState.LessonLine = card.line) {
                is FiefUiState.LessonLine.Idle ->
                    IdleLesson(lesson = card.lesson, line = line, isWaiting = isWaiting, onIntent = onIntent)
                is FiefUiState.LessonLine.Busy ->
                    BusyLesson(lesson = card.lesson, line = line, isWaiting = isWaiting, onIntent = onIntent)
                FiefUiState.LessonLine.Done -> DoneLesson(onReviewOpen = onReviewOpen)
            }
        }
    }
}

@Composable
private fun IdleLesson(
    lesson: LessonId,
    line: FiefUiState.LessonLine.Idle,
    isWaiting: Boolean,
    onIntent: (FiefIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val reason: String? = if (line.isStudyRunning) stringResource(R.string.reason_study_running) else null
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameButton(
            label = stringResource(R.string.lesson_start),
            isBusy = isWaiting,
            busyDescription = stringResource(R.string.building_waiting),
            onClick = { onIntent(FiefIntent.LessonStudyTapped(lesson)) },
            blockedReason = reason,
        )
        MyGameText(
            text = icuStringResource(R.string.lesson_free, "count" to line.wordCount),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.inkMuted,
        )
        reason?.let { blocked: String ->
            BlockedReasonLine(blocked = BlockedReason(reason = blocked, ready = null, description = blocked))
        }
    }
}

@Composable
private fun BusyLesson(
    lesson: LessonId,
    line: FiefUiState.LessonLine.Busy,
    isWaiting: Boolean,
    onIntent: (FiefIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val countdown: String = countdownLabelOf(line.remaining)
    val description: String = icuStringResource(R.string.slot_countdown_description, "countdown" to countdown)
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameText(
            text = stringResource(R.string.lesson_busy),
            style = MyGameTypography.label,
            color = MyGameTheme.colors.inkMuted,
        )
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
            modifier = Modifier.clearAndSetSemantics { contentDescription = description },
        ) {
            MyGameIcon(icon = MyGameIcons.hourglass, tint = MyGameTheme.colors.umber)
            MyGameText(text = countdown, style = MyGameTypography.action, color = MyGameTheme.colors.ink)
        }
        MyGameButton(
            label = stringResource(R.string.study_cancel),
            isBusy = isWaiting,
            busyDescription = stringResource(R.string.building_waiting),
            onClick = { onIntent(FiefIntent.LessonCancelTapped(lesson)) },
        )
        MyGameText(
            text = stringResource(R.string.lesson_refund),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.inkMuted,
        )
    }
}

@Composable
private fun DoneLesson(onReviewOpen: () -> Unit, modifier: Modifier = Modifier) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1), modifier = modifier) {
        MyGameText(
            text = stringResource(R.string.lesson_done),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.ink,
        )
        MyGameTextLink(label = stringResource(R.string.lesson_review_link), onClick = onReviewOpen)
    }
}
