package com.emm.mygame.feature.school

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.MyGameButton
import com.emm.mygame.core.designsystem.MyGameCountdownGround
import com.emm.mygame.core.designsystem.MyGameCountdownLine
import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.designsystem.MyGameNextStepBlock
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.formatQuantity
import com.emm.mygame.core.network.HoldoutCheckWeek
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.NextStep
import com.emm.mygame.core.network.NextStepCard
import com.emm.mygame.core.network.PlacementBand
import com.emm.mygame.core.ui.CopyReader
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.rememberPlayerCopy

@Composable
internal fun SchoolNextStep(
    content: SchoolUiState.Content,
    onIntent: (SchoolIntent) -> Unit,
    onReviewsOpen: () -> Unit,
    onLessonOpen: (LessonId) -> Unit,
    onReportOpen: () -> Unit,
    onHoldoutCheckOpen: (PlacementBand, HoldoutCheckWeek) -> Unit,
    modifier: Modifier = Modifier,
) {
    val card: NextStepCard = content.nextStep
    val copy: PlayerCopy = rememberPlayerCopy()
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step5), modifier = modifier) {
        MyGameNextStepBlock(
            title = copy.chrome(R.string.school_next_title),
            line = copy.lineOf(card.line),
            detail = card.detail?.let { detail: NextStepCard.Detail -> copy.detailOf(detail) },
        ) {
            NextStepCountdown(countdown = card.countdown, time = content.nextStepTime)
        }
        MyGameButton(
            label = copy.actionLabelOf(card.action),
            isBusy = card.action is NextStepCard.Action.StudyReleased &&
                content.start == SchoolUiState.LessonRequest.Waiting,
            busyDescription = copy.chrome(R.string.school_waiting).spoken,
            onClick = {
                when (val action: NextStepCard.Action = card.action) {
                    is NextStepCard.Action.ReadWords -> action.lesson?.let(onLessonOpen)
                    NextStepCard.Action.StartReviews -> onReviewsOpen()
                    is NextStepCard.Action.OpenHoldoutCheck -> onHoldoutCheckOpen(action.band, action.week)
                    is NextStepCard.Action.StudyReleased -> onIntent(SchoolIntent.StudyTapped(action.lesson))
                    is NextStepCard.Action.Study -> Unit
                    NextStepCard.Action.GoToReport -> onReportOpen()
                }
            },
        )
        (card.action as? NextStepCard.Action.StudyReleased)?.let { released: NextStepCard.Action.StudyReleased ->
            StartAnswer(lesson = released.lesson, start = content.start)
        }
    }
}

@Composable
private fun NextStepCountdown(
    countdown: NextStepCard.Countdown?,
    time: SchoolUiState.NextStepTime?,
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
        chrome(R.string.school_next_reviews_due, "count" to formatQuantity(line.count.toLong()))
    is NextStepCard.Line.HoldoutCheck ->
        fixedLabelOf(fixedCopy(R.string.school_next_holdout_check, "band" to line.band.number.toString()))
    NextStepCard.Line.Studying -> chrome(R.string.school_slot_title)
    is NextStepCard.Line.ReleasedLesson -> releasedTitleOf(line.band, set = line.number)
    is NextStepCard.Line.Lesson -> chrome(R.string.school_lesson_title, "number" to line.number.toString())
    NextStepCard.Line.NoReviewsDue -> chrome(R.string.school_next_no_reviews_due)
}

private fun PlayerCopy.detailOf(detail: NextStepCard.Detail): MyGameLabel = when (detail) {
    is NextStepCard.Detail.Build -> chrome(buildLineOf(detail.producer))
    is NextStepCard.Detail.Words -> chrome(R.string.school_lesson_words, "count" to detail.count)
}

private fun buildLineOf(producer: NextStep.Producer): Int = when (producer) {
    NextStep.Producer.Farm -> R.string.school_next_build_farm
    NextStep.Producer.Factory -> R.string.school_next_build_factory
    NextStep.Producer.PowerStation -> R.string.school_next_build_power_station
}

private fun CopyReader.countdownWordsOf(countdown: NextStepCard.Countdown): String = when (countdown) {
    is NextStepCard.Countdown.LessonReady ->
        text(R.string.school_next_lesson_ready_in, "number" to countdown.number.toString())
    is NextStepCard.Countdown.NextReview -> text(R.string.school_next_review)
}

private fun PlayerCopy.actionLabelOf(action: NextStepCard.Action): MyGameLabel = when (action) {
    is NextStepCard.Action.ReadWords -> chrome(R.string.school_lesson_read_words)
    NextStepCard.Action.StartReviews -> chrome(R.string.school_start_reviews)
    is NextStepCard.Action.OpenHoldoutCheck -> fixedLabelOf(fixedCopy(R.string.school_holdout_open))
    is NextStepCard.Action.StudyReleased -> fixedLabelOf(fixedCopy(R.string.school_released_lesson_study))
    is NextStepCard.Action.Study -> chrome(R.string.school_lesson_study, "number" to action.number.toString())
    NextStepCard.Action.GoToReport -> chrome(R.string.school_next_go_to_report)
}
