package com.emm.mygame.feature.school

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import com.emm.mygame.core.designsystem.MyGameTextLink
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.LessonName
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
            val name: LessonName = content.nameOf(unread) ?: return
            MyGameTextLink(
                label = readWordsLabelOf(unread, name, shown),
                onClick = { onLessonOpen(unread) },
                modifier = modifier,
            )
        }
        NextStepCard.Action.StartReviews -> MyGameTextLink(
            label = stringResource(R.string.school_start_reviews),
            onClick = onReviewsOpen,
            modifier = modifier,
        )
        is NextStepCard.Action.OpenHoldoutCheck,
        is NextStepCard.Action.StudyReleased,
        is NextStepCard.Action.Study,
        NextStepCard.Action.GoToReport,
        -> Unit
    }
}

private fun SchoolUiState.Content.nameOf(lesson: LessonId): LessonName? {
    val released: SchoolUiState.ReleasedLessonCard? =
        releasedLessons.firstOrNull { card: SchoolUiState.ReleasedLessonCard -> card.lesson == lesson }
    if (released != null) return released.name
    return lessons
        .firstOrNull { card: SchoolUiState.LessonCard -> card.lesson == lesson }
        ?.let { card: SchoolUiState.LessonCard -> LessonName.Shelved(card.number) }
}
