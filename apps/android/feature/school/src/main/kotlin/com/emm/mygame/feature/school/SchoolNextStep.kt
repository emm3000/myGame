package com.emm.mygame.feature.school

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import com.emm.mygame.core.designsystem.MyGameButton
import com.emm.mygame.core.designsystem.MyGameCountdownGround
import com.emm.mygame.core.designsystem.MyGameCountdownLine
import com.emm.mygame.core.designsystem.MyGameNextStepBlock
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.formatQuantity
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.NextStep
import com.emm.mygame.core.network.NextStepCard
import com.emm.mygame.core.ui.icuStringResource

@Composable
internal fun SchoolNextStep(
    content: SchoolUiState.Content,
    onReviewsOpen: () -> Unit,
    onLessonOpen: (LessonId) -> Unit,
    onReportOpen: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val card: NextStepCard = content.nextStep
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step5), modifier = modifier) {
        MyGameNextStepBlock(
            title = stringResource(R.string.school_next_title),
            line = lineOf(card.line),
            detail = card.detail?.let { detail: NextStepCard.Detail -> detailOf(detail) },
        ) {
            NextStepCountdown(countdown = card.countdown, time = content.nextStepTime)
        }
        MyGameButton(
            label = actionLabelOf(card.action),
            isBusy = false,
            busyDescription = stringResource(R.string.school_waiting),
            onClick = {
                when (val action: NextStepCard.Action = card.action) {
                    is NextStepCard.Action.ReadWords -> action.lesson?.let(onLessonOpen)
                    NextStepCard.Action.StartReviews -> onReviewsOpen()
                    is NextStepCard.Action.Study -> Unit
                    NextStepCard.Action.GoToReport -> onReportOpen()
                }
            },
        )
    }
}

@Composable
private fun NextStepCountdown(
    countdown: NextStepCard.Countdown?,
    time: SchoolUiState.NextStepTime?,
    modifier: Modifier = Modifier,
) {
    if (countdown == null || time == null) return
    MyGameCountdownLine(
        words = countdownWordsOf(countdown),
        time = finishLabelOf(time.remaining, time.finishesAt),
        ground = MyGameCountdownGround.Block,
        modifier = modifier,
    )
}

@Composable
private fun lineOf(line: NextStepCard.Line): String = when (line) {
    is NextStepCard.Line.ReviewsDue ->
        icuStringResource(R.string.school_next_reviews_due, "count" to formatQuantity(line.count.toLong()))
    NextStepCard.Line.Studying -> stringResource(R.string.school_slot_title)
    is NextStepCard.Line.Lesson -> icuStringResource(R.string.school_lesson_title, "number" to line.number.toString())
    NextStepCard.Line.NoReviewsDue -> stringResource(R.string.school_next_no_reviews_due)
}

@Composable
private fun detailOf(detail: NextStepCard.Detail): String = when (detail) {
    is NextStepCard.Detail.Build -> stringResource(buildLineOf(detail.producer))
    is NextStepCard.Detail.Words -> icuStringResource(R.string.school_lesson_words, "count" to detail.count)
}

private fun buildLineOf(producer: NextStep.Producer): Int = when (producer) {
    NextStep.Producer.Farm -> R.string.school_next_build_farm
    NextStep.Producer.Factory -> R.string.school_next_build_factory
    NextStep.Producer.PowerStation -> R.string.school_next_build_power_station
}

@Composable
private fun countdownWordsOf(countdown: NextStepCard.Countdown): String = when (countdown) {
    is NextStepCard.Countdown.LessonReady ->
        icuStringResource(R.string.school_next_lesson_ready_in, "number" to countdown.number.toString())
    is NextStepCard.Countdown.NextReview -> stringResource(R.string.school_next_review)
}

@Composable
private fun actionLabelOf(action: NextStepCard.Action): String = when (action) {
    is NextStepCard.Action.ReadWords -> stringResource(R.string.school_lesson_read_words)
    NextStepCard.Action.StartReviews -> stringResource(R.string.school_start_reviews)
    is NextStepCard.Action.Study ->
        icuStringResource(R.string.school_lesson_study, "number" to action.number.toString())
    NextStepCard.Action.GoToReport -> stringResource(R.string.school_next_go_to_report)
}
