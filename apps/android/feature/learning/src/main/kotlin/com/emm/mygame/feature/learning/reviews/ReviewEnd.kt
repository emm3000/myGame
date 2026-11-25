package com.emm.mygame.feature.learning.reviews

import androidx.annotation.StringRes
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameBlock
import com.emm.mygame.core.designsystem.MyGameCard
import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.blockHueOf
import com.emm.mygame.core.model.town.school.SchoolPathCounts
import com.emm.mygame.core.ui.SchoolPath
import com.emm.mygame.core.ui.SchoolPathSteps
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.feature.learning.R

@Composable
internal fun LessonReady(ready: ReviewUiState.LessonReady, modifier: Modifier = Modifier) {
    val number: Int = ready.number ?: return
    MyGameBlock(hue = blockHueOf(number - 1), modifier = modifier) {
        MyGameText(
            label = chromeResource(R.string.review_lesson_ready, "number" to number.toString()),
            style = MyGameTypography.display,
            color = MyGameTheme.colors.onBlock,
            modifier = Modifier.semantics { heading() },
        )
    }
}

@Composable
internal fun ReviewEnd(
    line: MyGameLabel,
    modifier: Modifier = Modifier,
    path: ReviewUiState.LessonPath? = null,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step4), modifier = modifier) {
        ReviewsAhead(line = line)
        path?.let { shown: ReviewUiState.LessonPath -> LessonPath(path = shown) }
    }
}

@Composable
private fun ReviewsAhead(line: MyGameLabel, modifier: Modifier = Modifier) {
    MyGameCard(modifier = modifier) {
        MyGameText(
            label = line,
            style = MyGameTypography.body,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.padding(vertical = MyGameSpacing.step4),
        )
    }
}

@Composable
private fun LessonPath(path: ReviewUiState.LessonPath, modifier: Modifier = Modifier) {
    val counts: SchoolPathCounts = path.counts
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameText(
            label = chromeResource(R.string.review_lesson_title, "number" to path.number.toString()),
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
    label = chromeResource(label),
    count = chromeResource(R.string.review_path_count, "count" to count.toString(), "total" to total.toString()),
)
