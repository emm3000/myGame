package com.emm.mygame.feature.school

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import com.emm.mygame.core.designsystem.MyGameGoOutlinedButton
import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameSunkenCard
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.formatQuantity
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.rememberPlayerCopy
import com.emm.mygame.core.ui.titledFinishLabelOf

internal const val REVIEWS_ROW: String = "reviews_row"

@Composable
internal fun ReviewsRow(
    line: SchoolUiState.ReviewsLine,
    onLessonOpen: (LessonId) -> Unit,
    onReviewsOpen: () -> Unit,
    modifier: Modifier = Modifier,
) {
    MyGameSunkenCard(modifier = modifier.testTag(REVIEWS_ROW)) {
        when (line) {
            is SchoolUiState.ReviewsLine.Due -> DueRow(
                line = line,
                onOpen = { line.readFirst?.let(onLessonOpen) ?: onReviewsOpen() },
            )
            is SchoolUiState.ReviewsLine.NoneDue -> NoneDueRow(line = line)
        }
    }
}

@Composable
private fun NoneDueRow(line: SchoolUiState.ReviewsLine.NoneDue, modifier: Modifier = Modifier) {
    val copy: PlayerCopy = rememberPlayerCopy()
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1), modifier = modifier) {
        MyGameText(
            label = copy.chrome(R.string.school_no_reviews_due),
            style = MyGameTypography.heading,
            color = MyGameTheme.colors.ink,
        )
        line.nextReview?.let { next: SchoolUiState.NextReview ->
            MyGameText(
                label = copy.chrome {
                    titledFinishLabelOf(R.string.school_next_review, next.remaining, next.at, schoolDurationCopy)
                },
                style = MyGameTypography.body,
                color = MyGameTheme.colors.inkMuted,
            )
        }
    }
}

@Composable
private fun DueRow(line: SchoolUiState.ReviewsLine.Due, onOpen: () -> Unit, modifier: Modifier = Modifier) {
    val copy: PlayerCopy = rememberPlayerCopy()
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameText(
            label = copy.chrome(R.string.school_reviews_due, "count" to formatQuantity(line.count.toLong())),
            style = MyGameTypography.heading,
            color = MyGameTheme.colors.ink,
        )
        MyGameGoOutlinedButton(
            label = copy.wayInOf(line),
            isBusy = false,
            busyDescription = copy.chrome(R.string.school_waiting),
            onClick = onOpen,
        )
    }
}

private fun PlayerCopy.wayInOf(line: SchoolUiState.ReviewsLine.Due): MyGameLabel =
    if (line.readFirst == null) chrome(R.string.school_start_reviews) else chrome(R.string.school_lesson_read_words)
