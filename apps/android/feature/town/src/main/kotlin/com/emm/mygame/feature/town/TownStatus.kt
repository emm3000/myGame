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
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameCountdownGround
import com.emm.mygame.core.designsystem.MyGameCountdownLine
import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.designsystem.MyGameOutlinedButton
import com.emm.mygame.core.designsystem.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.PreviewMyGame
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.LessonName
import com.emm.mygame.core.network.PlacementBand
import com.emm.mygame.core.ui.ChromePhase
import com.emm.mygame.core.ui.CopyLanguage
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.ProvideCopyLanguage
import com.emm.mygame.core.ui.ScaffoldLanguage
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.rememberPlayerCopy
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Instant

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
    val copy: PlayerCopy = rememberPlayerCopy()
    MyGameCountdownLine(
        words = copy.readyWordsOf(running.name),
        time = copy.chrome { finishLabelOf(running.remaining, running.finishesAt) },
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
    val waiting: String = chromeResource(R.string.town_waiting).spoken
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameText(
            label = rememberPlayerCopy().finishLineOf(notice.name),
            style = MyGameTypography.label,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite },
        )
        Row(horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2)) {
            MyGameOutlinedButton(
                label = chromeResource(
                    if (notice.firstUnread == null) R.string.town_next_start_reviews else R.string.town_next_read_words,
                ),
                isBusy = false,
                busyDescription = waiting,
                onClick = onOpen,
                modifier = Modifier.weight(1f),
            )
            MyGameOutlinedButton(
                label = chromeResource(R.string.town_status_finish_close),
                isBusy = false,
                busyDescription = waiting,
                onClick = onClose,
                modifier = Modifier.weight(1f),
            )
        }
    }
}

private fun PlayerCopy.readyWordsOf(name: LessonName): MyGameLabel = when (name) {
    is LessonName.Shelved -> chrome(R.string.town_next_lesson_ready_in, "number" to name.number.toString())
    is LessonName.Released -> MyGameLabel(
        text = fixedCopy(
            R.string.town_status_released_ready_in,
            "band" to name.band.number.toString(),
            "number" to name.set.toString(),
        ),
        translation = null,
    )
}

private fun PlayerCopy.finishLineOf(name: LessonName): MyGameLabel = when (name) {
    is LessonName.Shelved -> chrome(R.string.town_status_finish_line, "number" to name.number.toString())
    is LessonName.Released -> MyGameLabel(
        text = fixedCopy(
            R.string.town_status_released_finish_line,
            "band" to name.band.number.toString(),
            "number" to name.set.toString(),
        ),
        translation = null,
    )
}

@PreviewMyGame
@Composable
private fun TownStatusBothPreview() {
    ProvideCopyLanguage(language = CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Both)) {
        MyGamePreviewSurface {
            TownStatus(
                state = TownStatusUiState(
                    running = TownStatusUiState.RunningLesson(
                        name = LessonName.Shelved(number = 3),
                        remaining = 4.minutes,
                        finishesAt = Instant.parse("2026-11-12T15:04:00Z"),
                    ),
                    notice = TownStatusUiState.FinishNotice(
                        name = LessonName.Released(PlacementBand.Second, set = 2),
                        firstUnread = null,
                    ),
                ),
                onNoticeClose = {},
                onLessonOpen = {},
                onReviewsOpen = {},
            )
        }
    }
}
