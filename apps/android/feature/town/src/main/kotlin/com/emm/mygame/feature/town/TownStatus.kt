package com.emm.mygame.feature.town

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameCountdownGround
import com.emm.mygame.core.designsystem.MyGameCountdownLine
import com.emm.mygame.core.designsystem.MyGameOutlinedButton
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.ui.icuStringResource

const val TOWN_STATUS: String = "town_status"

@Composable
fun TownStatus(
    state: TownStatusUiState,
    onNoticeClose: () -> Unit,
    onLessonOpen: (LessonId) -> Unit,
    onReviewsOpen: () -> Unit,
    modifier: Modifier = Modifier,
) {
    if (state == TownStatusUiState.none) return
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        modifier = modifier
            .testTag(TOWN_STATUS)
            .fillMaxWidth()
            .background(MyGameTheme.colors.surfaceSunken)
            .padding(horizontal = MyGameSpacing.step4, vertical = MyGameSpacing.step2),
    ) {
        state.running?.let { running: TownStatusUiState.RunningLesson -> RunningLessonLine(running) }
        state.notice?.let { notice: TownStatusUiState.FinishNotice ->
            FinishNoticeRows(
                notice = notice,
                onClose = onNoticeClose,
                onOpen = { notice.firstUnread?.let(onLessonOpen) ?: onReviewsOpen() },
            )
        }
    }
}

@Composable
private fun RunningLessonLine(running: TownStatusUiState.RunningLesson, modifier: Modifier = Modifier) {
    MyGameCountdownLine(
        words = icuStringResource(R.string.town_next_lesson_ready_in, "number" to running.number.toString()),
        time = finishLabelOf(running.remaining, running.finishesAt),
        ground = MyGameCountdownGround.Paper,
        modifier = modifier,
    )
}

@Composable
private fun FinishNoticeRows(
    notice: TownStatusUiState.FinishNotice,
    onClose: () -> Unit,
    onOpen: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val waiting: String = stringResource(R.string.town_waiting)
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameText(
            text = icuStringResource(R.string.town_status_finish_line, "number" to notice.number.toString()),
            style = MyGameTypography.label,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite },
        )
        Row(horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2)) {
            MyGameOutlinedButton(
                label = stringResource(
                    if (notice.firstUnread == null) R.string.town_next_start_reviews else R.string.town_next_read_words,
                ),
                isBusy = false,
                busyDescription = waiting,
                onClick = onOpen,
                modifier = Modifier.weight(1f),
            )
            MyGameOutlinedButton(
                label = stringResource(R.string.town_status_finish_close),
                isBusy = false,
                busyDescription = waiting,
                onClick = onClose,
                modifier = Modifier.weight(1f),
            )
        }
    }
}
