package com.emm.mygame.feature.school

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import com.emm.mygame.core.designsystem.MyGameTextLink
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.NextStepCard

@Composable
internal fun ReviewsLink(
    content: SchoolUiState.Content,
    shown: LessonId,
    onReviewsOpen: () -> Unit,
    onLessonOpen: (LessonId) -> Unit,
    modifier: Modifier = Modifier,
) {
    if (content.nextStep.line !is NextStepCard.Line.ReviewsDue) return
    when (val action: NextStepCard.Action = content.nextStep.action) {
        is NextStepCard.Action.ReadWords -> action.lesson?.let { unread: LessonId ->
            MyGameTextLink(
                label = readWordsLabelOf(unread, content.numberOf(unread), shown),
                onClick = { onLessonOpen(unread) },
                modifier = modifier,
            )
        }
        NextStepCard.Action.StartReviews -> MyGameTextLink(
            label = stringResource(R.string.school_start_reviews),
            onClick = onReviewsOpen,
            modifier = modifier,
        )
        is NextStepCard.Action.Study, NextStepCard.Action.GoToReport -> Unit
    }
}

private fun SchoolUiState.Content.numberOf(lesson: LessonId): Int =
    lessons.indexOfFirst { card: SchoolUiState.LessonCard -> card.lesson == lesson } + 1
