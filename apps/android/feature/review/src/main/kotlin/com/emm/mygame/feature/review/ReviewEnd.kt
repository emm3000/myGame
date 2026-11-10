package com.emm.mygame.feature.review

import androidx.annotation.StringRes
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameBlock
import com.emm.mygame.core.designsystem.MyGameButton
import com.emm.mygame.core.designsystem.MyGameCard
import com.emm.mygame.core.designsystem.MyGameIcon
import com.emm.mygame.core.designsystem.MyGameIcons
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.blockHueOf
import com.emm.mygame.core.designsystem.withTabularFigures
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.SchoolPathCounts
import com.emm.mygame.core.ui.SchoolPath
import com.emm.mygame.core.ui.SchoolPathSteps
import com.emm.mygame.core.ui.icuStringResource

@Composable
internal fun LessonReady(
    ready: ReviewUiState.LessonReady,
    onLessonOpen: (LessonId) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        ready.number?.let { number: Int ->
            MyGameBlock(hue = blockHueOf(number - 1)) {
                MyGameText(
                    text = icuStringResource(R.string.review_lesson_ready, "number" to number.toString()),
                    style = MyGameTypography.display,
                    color = MyGameTheme.colors.onBlock,
                    modifier = Modifier.semantics { heading() },
                )
            }
        }
        MyGameButton(
            label = stringResource(R.string.review_read_words),
            isBusy = false,
            busyDescription = stringResource(R.string.building_waiting),
            onClick = { onLessonOpen(ready.lesson) },
        )
    }
}

@Composable
internal fun ReviewEnd(
    line: String,
    onTownOpen: () -> Unit,
    modifier: Modifier = Modifier,
    nextReview: String? = null,
    path: ReviewUiState.LessonPath? = null,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step4), modifier = modifier) {
        ReviewsAhead(line = line, nextReview = nextReview)
        path?.let { shown: ReviewUiState.LessonPath -> LessonPath(path = shown) }
        MyGameButton(
            label = stringResource(R.string.review_back_to_town),
            isBusy = false,
            busyDescription = stringResource(R.string.building_waiting),
            onClick = onTownOpen,
        )
    }
}

@Composable
private fun ReviewsAhead(line: String, nextReview: String?, modifier: Modifier = Modifier) {
    MyGameCard(modifier = modifier) {
        Column(
            verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
            modifier = Modifier.padding(vertical = MyGameSpacing.step4),
        ) {
            MyGameText(text = line, style = MyGameTypography.body, color = MyGameTheme.colors.ink)
            nextReview?.let { due: String ->
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
                ) {
                    MyGameIcon(icon = MyGameIcons.hourglass, tint = MyGameTheme.colors.inkMuted)
                    MyGameText(
                        text = due,
                        style = MyGameTypography.caption.withTabularFigures(),
                        color = MyGameTheme.colors.ink,
                    )
                }
            }
        }
    }
}

@Composable
private fun LessonPath(path: ReviewUiState.LessonPath, modifier: Modifier = Modifier) {
    val counts: SchoolPathCounts = path.counts
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameText(
            text = icuStringResource(R.string.review_lesson_title, "number" to path.number.toString()),
            style = MyGameTypography.heading,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { heading() },
        )
        SchoolPath(
            steps = SchoolPathSteps(
                studied = pathStepOf(R.string.review_path_studied, counts.held, counts.held),
                read = pathStepOf(R.string.review_path_read, counts.read, counts.held),
                reviewed = pathStepOf(R.string.review_path_reviewed, counts.reviewed, counts.held),
                learned = pathStepOf(R.string.review_path_learned, counts.learned, counts.held),
            ),
        )
    }
}

@Composable
private fun pathStepOf(@StringRes label: Int, count: Int, total: Int): SchoolPathSteps.Step = SchoolPathSteps.Step(
    label = stringResource(label),
    count = icuStringResource(R.string.review_path_count, "count" to count.toString(), "total" to total.toString()),
)
