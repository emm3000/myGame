package com.emm.mygame.feature.town

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import com.emm.mygame.core.designsystem.MyGameCountdownGround
import com.emm.mygame.core.designsystem.MyGameCountdownLine
import com.emm.mygame.core.designsystem.MyGameDock
import com.emm.mygame.core.designsystem.MyGameDockDoor
import com.emm.mygame.core.designsystem.MyGameDockGo
import com.emm.mygame.core.designsystem.MyGameDockLine
import com.emm.mygame.core.designsystem.MyGameDockLineText
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.designsystem.MyGameOutlinedButton
import com.emm.mygame.core.designsystem.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.PreviewMyGame
import com.emm.mygame.core.designsystem.formatQuantity
import com.emm.mygame.core.network.NextStepCard
import com.emm.mygame.core.network.TownGoal
import com.emm.mygame.core.ui.CopyReader
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.rememberPlayerCopy
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Instant

const val TOWN_DOCK: String = "town_dock"

@Composable
fun TownDock(
    dock: TownStatusUiState.Dock,
    actions: TownDockActions,
    onFoldChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    door: MyGameDockDoor? = null,
    inPlace: MyGameDockGo? = null,
) {
    val copy: PlayerCopy = rememberPlayerCopy()
    MyGameDock(
        line = copy.dockLineOf(dock),
        go = copy.dockGoOf(dock, actions, inPlace),
        onFoldChange = onFoldChange,
        modifier = modifier.testTag(TOWN_DOCK),
        door = door,
        countdown = { DockCountdown(dock = dock) },
        notice = { DockNotice(dock = dock) },
    )
}

@Composable
fun TownDockTop(dock: TownStatusUiState.Dock, modifier: Modifier = Modifier, door: MyGameDockDoor? = null) {
    val copy: PlayerCopy = rememberPlayerCopy()
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier.fillMaxWidth()) {
        MyGameDockLineText(line = copy.dockLineOf(dock), loadingLabel = copy.chrome(R.string.town_waiting).spoken)
        DockCountdown(dock = dock)
        DockNotice(dock = dock)
        door?.let { shown: MyGameDockDoor ->
            MyGameOutlinedButton(
                label = shown.label,
                isBusy = false,
                busyDescription = shown.label.spoken,
                onClick = shown.onClick,
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}

@Composable
fun reportDoor(onClick: () -> Unit): MyGameDockDoor =
    MyGameDockDoor(label = chromeResource(R.string.town_door_report), onClick = onClick)

@Composable
private fun DockCountdown(dock: TownStatusUiState.Dock, modifier: Modifier = Modifier) {
    val step: TownStatusUiState.Dock.Step = dock as? TownStatusUiState.Dock.Step ?: return
    val copy: PlayerCopy = rememberPlayerCopy()
    val words: TownStatusUiState.StepDetail.Words? = step.detail as? TownStatusUiState.StepDetail.Words
    val countdown: TownStatusUiState.StepCountdown? = step.countdown
    val goal: TownGoal? = step.goalUnderLine()
    if (words == null && countdown == null && goal == null) return
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        goal?.let { shown: TownGoal ->
            MyGameText(
                label = copy.chrome { goalLineOf(shown) },
                style = MyGameTypography.body,
                color = MyGameTheme.colors.inkMuted,
            )
        }
        words?.let { detail: TownStatusUiState.StepDetail.Words ->
            MyGameText(
                label = copy.chrome(R.string.town_next_lesson_words, "count" to detail.count),
                style = MyGameTypography.body,
                color = MyGameTheme.colors.inkMuted,
            )
        }
        countdown?.let { shown: TownStatusUiState.StepCountdown ->
            MyGameCountdownLine(
                words = copy.chrome { countdownWordsOf(shown.countdown) },
                time = copy.chrome { finishLabelOf(shown.remaining, shown.finishesAt) },
                ground = MyGameCountdownGround.Paper,
            )
        }
    }
}

@Composable
private fun DockNotice(dock: TownStatusUiState.Dock, modifier: Modifier = Modifier) {
    val step: TownStatusUiState.Dock.Step = dock as? TownStatusUiState.Dock.Step ?: return
    val copy: PlayerCopy = rememberPlayerCopy()
    val message: String = when (val start: TownUiState.LessonStartStatus = step.lessonStart) {
        is TownUiState.LessonStartStatus.Refused -> copy.fixedCopy { lessonRefusalLineOf(start.refusal) }
        TownUiState.LessonStartStatus.Unreachable -> copy.fixedCopy(R.string.town_refusal_unexpected)
        TownUiState.LessonStartStatus.Idle, TownUiState.LessonStartStatus.Waiting -> return
    }
    MyGameInlineAlert(message = message, modifier = modifier)
}

private fun PlayerCopy.dockLineOf(dock: TownStatusUiState.Dock): MyGameDockLine = MyGameDockLine(
    title = chrome(R.string.town_next_title),
    step = when (dock) {
        TownStatusUiState.Dock.Loading -> null
        TownStatusUiState.Dock.Refused -> fixedLabel(fixedCopy(R.string.town_refusal_unexpected))
        is TownStatusUiState.Dock.Step -> stepLineOf(dock)
    },
)

private fun PlayerCopy.stepLineOf(step: TownStatusUiState.Dock.Step): MyGameLabel {
    val detail: TownStatusUiState.StepDetail? = step.detail
    if (detail !is TownStatusUiState.StepDetail.Goal || step.isFullCap()) return lineOf(step.line)
    return chrome { goalLineOf(detail.goal) }
}

private fun TownStatusUiState.Dock.Step.isFullCap(): Boolean = line is NextStepCard.Line.LearningCap

private fun TownStatusUiState.Dock.Step.goalUnderLine(): TownGoal? =
    (detail as? TownStatusUiState.StepDetail.Goal)?.goal?.takeIf { isFullCap() }

private fun PlayerCopy.dockGoOf(
    dock: TownStatusUiState.Dock,
    actions: TownDockActions,
    inPlace: MyGameDockGo?,
): MyGameDockGo {
    val waiting: String = chrome(R.string.town_waiting).spoken
    return when (dock) {
        TownStatusUiState.Dock.Loading -> MyGameDockGo(
            label = chrome(R.string.town_waiting),
            isBusy = true,
            busyDescription = waiting,
            onClick = {},
        )
        TownStatusUiState.Dock.Refused -> MyGameDockGo(
            label = chrome(R.string.town_try_again),
            isBusy = false,
            busyDescription = waiting,
            onClick = { actions.onIntent(TownStatusIntent.TryAgainTapped) },
        )
        is TownStatusUiState.Dock.Step -> stepGoOf(dock, actions, inPlace, waiting)
    }
}

private fun PlayerCopy.stepGoOf(
    step: TownStatusUiState.Dock.Step,
    actions: TownDockActions,
    inPlace: MyGameDockGo?,
    waiting: String,
): MyGameDockGo {
    val badge: String? = (step.line as? NextStepCard.Line.ReviewsDue)?.count?.let { count: Int ->
        formatQuantity(count.toLong())
    }
    return when (val go: TownStatusUiState.Go = step.go) {
        is TownStatusUiState.Go.Acts -> MyGameDockGo(
            label = actionLabelOf(go.action),
            isBusy = go.isBusy,
            busyDescription = waiting,
            onClick = { actions.act(go.action) },
            badge = badge,
        )
        is TownStatusUiState.Go.ActsInPlace -> inPlace ?: MyGameDockGo(
            label = actionLabelOf(go.action),
            isBusy = true,
            busyDescription = waiting,
            onClick = {},
        )
        is TownStatusUiState.Go.Blocked -> MyGameDockGo(
            label = actionLabelOf(go.action),
            isBusy = false,
            busyDescription = waiting,
            onClick = {},
            blockedReason = blockOf(go.reason, step.countdown),
            badge = badge,
        )
    }
}

private fun TownDockActions.act(action: NextStepCard.Action) {
    when (action) {
        is NextStepCard.Action.ReadWords -> action.lesson?.let(onLessonOpen) ?: onSchoolOpen()
        NextStepCard.Action.StartReviews -> onReviewsOpen()
        is NextStepCard.Action.OpenHoldoutCheck -> onHoldoutCheckOpen(action.band, action.week)
        is NextStepCard.Action.StudyReleased -> onIntent(TownStatusIntent.ReleasedLessonTapped(action.lesson))
        is NextStepCard.Action.Study -> onSchoolOpen()
        NextStepCard.Action.GoToReport -> onReportOpen()
    }
}

private fun PlayerCopy.blockOf(reason: TownStatusUiState.GoBlock, countdown: TownStatusUiState.StepCountdown?): String =
    when (reason) {
        TownStatusUiState.GoBlock.NextReview -> countdown?.let { shown: TownStatusUiState.StepCountdown ->
            chrome {
                "${countdownWordsOf(shown.countdown)} ${finishLabelOf(shown.remaining, shown.finishesAt)}"
            }.spoken
        } ?: chrome(R.string.town_next_no_reviews_due).spoken
        TownStatusUiState.GoBlock.NoReviewsDue -> chrome(R.string.town_next_no_reviews_due).spoken
        TownStatusUiState.GoBlock.Studying -> chrome(R.string.town_next_studying).spoken
    }

private fun PlayerCopy.lineOf(line: NextStepCard.Line): MyGameLabel = when (line) {
    is NextStepCard.Line.ReviewsDue ->
        chrome(R.string.town_next_reviews_due, "count" to formatQuantity(line.count.toLong()))
    is NextStepCard.Line.HoldoutCheck ->
        fixedLabel(fixedCopy(R.string.town_next_holdout_check, "band" to line.band.number.toString()))
    NextStepCard.Line.Studying -> chrome(R.string.town_next_studying)
    is NextStepCard.Line.ReleasedLesson -> fixedLabel(
        fixedCopy(
            R.string.town_next_released_lesson,
            "band" to line.band.number.toString(),
            "number" to line.number.toString(),
        ),
    )
    is NextStepCard.Line.Lesson -> chrome(R.string.town_next_lesson_title, "number" to line.number.toString())
    NextStepCard.Line.NoReviewsDue -> chrome(R.string.town_next_no_reviews_due)
    is NextStepCard.Line.LearningCap -> chrome(
        R.string.town_next_learning_cap,
        "inLearning" to line.inLearning.toString(),
        "cap" to line.cap.toString(),
    )
}

private fun fixedLabel(text: String): MyGameLabel = MyGameLabel(text = text, translation = null)

private fun CopyReader.countdownWordsOf(countdown: NextStepCard.Countdown): String = when (countdown) {
    is NextStepCard.Countdown.LessonReady ->
        text(R.string.town_next_lesson_ready_in, "number" to countdown.number.toString())
    is NextStepCard.Countdown.NextReview -> text(R.string.town_next_review)
}

private fun PlayerCopy.actionLabelOf(action: NextStepCard.Action): MyGameLabel = when (action) {
    is NextStepCard.Action.ReadWords -> chrome(R.string.town_next_read_words)
    NextStepCard.Action.StartReviews -> chrome(R.string.town_next_start_reviews)
    is NextStepCard.Action.OpenHoldoutCheck -> fixedLabel(fixedCopy(R.string.town_next_holdout_open))
    is NextStepCard.Action.StudyReleased -> fixedLabel(fixedCopy(R.string.town_next_study_released))
    is NextStepCard.Action.Study -> chrome(R.string.town_next_study, "number" to action.number.toString())
    NextStepCard.Action.GoToReport -> chrome(R.string.town_next_go_to_report)
}

private val previewDueAt: Instant = Instant.parse("2026-11-18T23:15:00Z")

private val previewActions: TownDockActions = TownDockActions(
    onIntent = {},
    onLessonOpen = {},
    onSchoolOpen = {},
    onReviewsOpen = {},
    onReportOpen = {},
    onHoldoutCheckOpen = { _, _ -> },
)

private val previewStep: TownStatusUiState.Dock.Step = TownStatusUiState.Dock.Step(
    line = NextStepCard.Line.ReviewsDue(count = 4),
    detail = null,
    countdown = TownStatusUiState.StepCountdown(
        countdown = NextStepCard.Countdown.NextReview(at = previewDueAt),
        remaining = 40.minutes,
        finishesAt = previewDueAt,
    ),
    go = TownStatusUiState.Go.Acts(NextStepCard.Action.StartReviews, isBusy = false),
    lessonStart = TownUiState.LessonStartStatus.Idle,
)

@PreviewMyGame
@Composable
private fun TownDockPreview() {
    MyGamePreviewSurface {
        TownDock(
            dock = previewStep,
            actions = previewActions,
            onFoldChange = {},
            door = MyGameDockDoor(label = MyGameLabel(text = "Report", translation = null), onClick = {}),
        )
    }
}

@PreviewMyGame
@Composable
private fun TownDockLoadingPreview() {
    MyGamePreviewSurface {
        TownDock(dock = TownStatusUiState.Dock.Loading, actions = previewActions, onFoldChange = {})
    }
}

@PreviewMyGame
@Composable
private fun TownDockTopPreview() {
    MyGamePreviewSurface {
        TownDockTop(
            dock = previewStep,
            door = MyGameDockDoor(label = MyGameLabel(text = "Town", translation = null), onClick = {}),
        )
    }
}
