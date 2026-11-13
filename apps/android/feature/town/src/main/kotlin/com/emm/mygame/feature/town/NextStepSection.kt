package com.emm.mygame.feature.town

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.MyGameBlockHue
import com.emm.mygame.core.designsystem.MyGameBlockStack
import com.emm.mygame.core.designsystem.MyGameButton
import com.emm.mygame.core.designsystem.MyGameCountdownGround
import com.emm.mygame.core.designsystem.MyGameCountdownLine
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.designsystem.MyGameNextStepBlock
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameTextButton
import com.emm.mygame.core.designsystem.formatQuantity
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.NextStep
import com.emm.mygame.core.network.NextStepCard
import com.emm.mygame.core.network.TownGoal
import com.emm.mygame.core.ui.CopyReader
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.rememberPlayerCopy

@Composable
internal fun NextStepSection(
    content: TownUiState.Content,
    onIntent: (TownIntent) -> Unit,
    onSchoolOpen: () -> Unit,
    onReportOpen: () -> Unit,
    onReviewsOpen: () -> Unit,
    onLessonOpen: (LessonId) -> Unit,
    modifier: Modifier = Modifier,
) {
    val card: NextStepCard = content.nextStep
    val copy: PlayerCopy = rememberPlayerCopy()
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step5), modifier = modifier) {
        MyGameBlockStack(nearHue = MyGameBlockHue.Lavender, farHue = MyGameBlockHue.Mint, dealtKey = null) {
            MyGameNextStepBlock(
                title = copy.chrome(R.string.town_next_title),
                line = copy.lineOf(card.line),
                detail = card.detail?.let { detail: NextStepCard.Detail -> copy.chrome { detailOf(detail) } }
                    ?: content.goal?.let { goal: TownGoal -> copy.chrome { goalLineOf(goal) } },
            ) {
                content.goal?.let { goal: TownGoal -> GoalState(goal = goal) }
                NextStepCountdown(countdown = card.countdown, time = content.nextStepTime)
            }
        }
        MyGameButton(
            label = copy.actionLabelOf(card.action),
            isBusy = card.action is NextStepCard.Action.StudyReleased &&
                content.lessonStart == TownUiState.LessonStartStatus.Waiting,
            busyDescription = copy.chrome(R.string.town_waiting).spoken,
            onClick = {
                when (val action: NextStepCard.Action = card.action) {
                    is NextStepCard.Action.ReadWords -> action.lesson?.let(onLessonOpen) ?: onSchoolOpen()
                    NextStepCard.Action.StartReviews -> onReviewsOpen()
                    is NextStepCard.Action.OpenHoldoutCheck ->
                        onIntent(TownIntent.HoldoutCheckTapped(action.band, action.week))
                    is NextStepCard.Action.StudyReleased -> onIntent(TownIntent.ReleasedLessonTapped(action.lesson))
                    is NextStepCard.Action.Study -> onSchoolOpen()
                    NextStepCard.Action.GoToReport -> onReportOpen()
                }
            },
        )
        LessonStartAnswer(start = content.lessonStart)
        if (content.goal != null) {
            MyGameTextButton(
                label = copy.chrome(R.string.town_goal_close),
                isBusy = false,
                busyDescription = copy.chrome(R.string.town_waiting).spoken,
                onClick = { onIntent(TownIntent.GoalClosed) },
            )
        }
    }
}

@Composable
private fun LessonStartAnswer(start: TownUiState.LessonStartStatus, modifier: Modifier = Modifier) {
    val copy: PlayerCopy = rememberPlayerCopy()
    val message: String = when (start) {
        is TownUiState.LessonStartStatus.Refused -> copy.fixedCopy { lessonRefusalLineOf(start.refusal) }
        TownUiState.LessonStartStatus.Unreachable -> copy.fixedCopy(R.string.town_refusal_unexpected)
        TownUiState.LessonStartStatus.Idle, TownUiState.LessonStartStatus.Waiting -> return
    }
    MyGameInlineAlert(message = message, modifier = modifier)
}

@Composable
private fun NextStepCountdown(
    countdown: NextStepCard.Countdown?,
    time: TownUiState.NextStepTime?,
    modifier: Modifier = Modifier,
) {
    if (countdown == null || time == null) return
    val copy: PlayerCopy = rememberPlayerCopy()
    MyGameCountdownLine(
        words = copy.chrome { countdownWordsOf(countdown) },
        time = copy.chrome { finishLabelOf(time.remaining, time.finishesAt) },
        ground = MyGameCountdownGround.Block,
        modifier = modifier,
    )
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
}

private fun fixedLabel(text: String): MyGameLabel = MyGameLabel(text = text, translation = null)

private fun CopyReader.detailOf(detail: NextStepCard.Detail): String = when (detail) {
    is NextStepCard.Detail.Build -> text(buildLineOf(detail.producer))
    is NextStepCard.Detail.Words -> text(R.string.town_next_lesson_words, "count" to detail.count)
}

private fun buildLineOf(producer: NextStep.Producer): Int = when (producer) {
    NextStep.Producer.Farm -> R.string.town_next_build_farm
    NextStep.Producer.Factory -> R.string.town_next_build_factory
    NextStep.Producer.PowerStation -> R.string.town_next_build_power_station
}

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
