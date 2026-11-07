package com.emm.mygame.feature.school

import androidx.annotation.StringRes
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTag
import com.emm.mygame.core.designsystem.MyGameHairline
import com.emm.mygame.core.designsystem.MyGameSizes
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.network.SchoolPathCounts
import com.emm.mygame.core.ui.SchoolPath
import com.emm.mygame.core.ui.SchoolPathSteps
import com.emm.mygame.core.ui.icuStringResource

internal const val LESSON_ROW: String = "lesson_row"

@Composable
internal fun LessonRows(
    content: SchoolUiState.Content,
    onIntent: (SchoolIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val cards: List<SchoolUiState.LessonCard> = content.lessons.filter { card: SchoolUiState.LessonCard ->
        card.lesson != content.shown?.lesson
    }
    if (cards.isEmpty()) return
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1), modifier = modifier) {
        MyGameText(
            text = stringResource(R.string.school_lessons),
            style = MyGameTypography.heading,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { heading() },
        )
        cards.forEachIndexed { index: Int, card: SchoolUiState.LessonCard ->
            if (index > 0) MyGameHairline()
            LessonRow(card = card, onIntent = onIntent)
        }
    }
}

@Composable
private fun LessonRow(
    card: SchoolUiState.LessonCard,
    onIntent: (SchoolIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(modifier = modifier.fillMaxWidth().semantics { testTag = LESSON_ROW }) {
        LessonTarget(card = card, onIntent = onIntent)
        LessonPath(path = card.path, modifier = Modifier.padding(bottom = MyGameSpacing.step3))
    }
}

@Composable
private fun LessonPath(path: SchoolPathCounts, modifier: Modifier = Modifier) {
    if (path.held == 0) return
    SchoolPath(
        steps = SchoolPathSteps(
            studied = pathStepOf(R.string.school_path_studied, path.held, path.held),
            read = pathStepOf(R.string.school_path_read, path.read, path.held),
            reviewed = pathStepOf(R.string.school_path_reviewed, path.reviewed, path.held),
            learned = pathStepOf(R.string.school_path_learned, path.learned, path.held),
        ),
        modifier = modifier,
    )
}

@Composable
private fun pathStepOf(@StringRes label: Int, count: Int, total: Int): SchoolPathSteps.Step = SchoolPathSteps.Step(
    label = stringResource(label),
    count = icuStringResource(
        R.string.school_path_count,
        "count" to count.toString(),
        "total" to total.toString(),
    ),
)

@Composable
private fun LessonTarget(
    card: SchoolUiState.LessonCard,
    onIntent: (SchoolIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val target: Modifier = if (card.state == SchoolUiState.LessonState.Studied) {
        Modifier.semantics(mergeDescendants = true) { }
    } else {
        Modifier
            .defaultMinSize(minHeight = MyGameSizes.secondary)
            .clickable(role = Role.Button, onClick = { onIntent(SchoolIntent.LessonSelected(card.lesson)) })
    }
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
        modifier = modifier
            .fillMaxWidth()
            .then(target)
            .padding(vertical = MyGameSpacing.step3),
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step3)) {
            MyGameText(
                text = icuStringResource(R.string.school_lesson_title, "number" to card.number.toString()),
                style = MyGameTypography.title,
                color = MyGameTheme.colors.ink,
                modifier = Modifier.alignByBaseline(),
            )
            statusOf(card.state)?.let { status: Int ->
                MyGameText(
                    text = stringResource(status),
                    style = MyGameTypography.caption,
                    color = MyGameTheme.colors.inkMuted,
                    modifier = Modifier.alignByBaseline(),
                )
            }
        }
        MyGameText(text = card.theme, style = MyGameTypography.body, color = MyGameTheme.colors.ink)
        MyGameText(text = lessonSummaryOf(card), style = MyGameTypography.caption, color = MyGameTheme.colors.inkMuted)
    }
}

@StringRes
private fun statusOf(state: SchoolUiState.LessonState): Int? = when (state) {
    SchoolUiState.LessonState.Studied -> R.string.school_lesson_studied
    SchoolUiState.LessonState.Studying -> R.string.school_lesson_studying
    is SchoolUiState.LessonState.Open -> null
}
