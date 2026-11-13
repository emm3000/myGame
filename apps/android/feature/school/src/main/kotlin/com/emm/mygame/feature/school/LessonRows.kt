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
import com.emm.mygame.core.designsystem.MyGameOutlinedButton
import com.emm.mygame.core.designsystem.MyGameSizes
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.network.SchoolPathCounts
import com.emm.mygame.core.ui.SchoolPath
import com.emm.mygame.core.ui.SchoolPathSteps
import com.emm.mygame.core.ui.fixedCopyResource
import com.emm.mygame.core.ui.icuStringResource

internal const val LESSON_ROW: String = "lesson_row"

@Composable
internal fun LessonRows(
    content: SchoolUiState.Content,
    onIntent: (SchoolIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val cards: List<SchoolUiState.LessonCard> = content.lessons.filter { card: SchoolUiState.LessonCard ->
        card.lesson != content.blockLesson?.lesson
    }
    if (cards.isEmpty() && content.releasedLessons.isEmpty()) return
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
        content.releasedLessons.forEachIndexed { index: Int, card: SchoolUiState.ReleasedLessonCard ->
            if (index > 0 || cards.isNotEmpty()) MyGameHairline()
            ReleasedLessonRow(card = card, start = content.start, onIntent = onIntent)
        }
    }
}

@Composable
private fun ReleasedLessonRow(
    card: SchoolUiState.ReleasedLessonCard,
    start: SchoolUiState.LessonRequest,
    onIntent: (SchoolIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = MyGameSpacing.step3),
    ) {
        Column(
            verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
            modifier = Modifier.semantics(mergeDescendants = true) { },
        ) {
            LessonHeading(title = lessonTitleOf(card.name), state = card.state)
            MyGameText(
                text = icuStringResource(R.string.school_lesson_words, "count" to card.wordCount),
                style = MyGameTypography.caption,
                color = MyGameTheme.colors.inkMuted,
            )
        }
        LessonPath(path = card.path)
        (card.state as? SchoolUiState.LessonState.Open)?.let { open: SchoolUiState.LessonState.Open ->
            ReleasedStudyAction(card = card, block = open.block, start = start, onIntent = onIntent)
        }
    }
}

@Composable
private fun ReleasedStudyAction(
    card: SchoolUiState.ReleasedLessonCard,
    block: SchoolUiState.LessonBlock?,
    start: SchoolUiState.LessonRequest,
    onIntent: (SchoolIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val reason: String? = block?.let { blocked: SchoolUiState.LessonBlock -> blockLineOf(blocked) }
    val label: String = icuStringResource(
        R.string.school_study_with_duration,
        "action" to fixedCopyResource(R.string.school_released_lesson_study),
        "duration" to durationLabelOf(card.duration),
    )
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameOutlinedButton(
            label = label,
            isBusy = start == SchoolUiState.LessonRequest.Waiting,
            busyDescription = stringResource(R.string.school_waiting),
            onClick = { onIntent(SchoolIntent.StudyTapped(card.lesson)) },
            blockedReason = reason,
            accessibleName = "${lessonTitleOf(card.name)} · $label",
        )
        reason?.let { line: String -> BlockLine(line = line) }
        StartAnswer(lesson = card.lesson, start = start)
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
        LessonHeading(
            title = icuStringResource(R.string.school_lesson_title, "number" to card.number.toString()),
            state = card.state,
        )
        MyGameText(text = card.theme, style = MyGameTypography.body, color = MyGameTheme.colors.ink)
        MyGameText(text = lessonSummaryOf(card), style = MyGameTypography.caption, color = MyGameTheme.colors.inkMuted)
    }
}

@Composable
private fun LessonHeading(title: String, state: SchoolUiState.LessonState, modifier: Modifier = Modifier) {
    Row(horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        MyGameText(
            text = title,
            style = MyGameTypography.title,
            color = MyGameTheme.colors.ink,
            modifier = Modifier
                .weight(1f, fill = false)
                .alignByBaseline(),
        )
        statusOf(state)?.let { status: Int ->
            MyGameText(
                text = stringResource(status),
                style = MyGameTypography.caption,
                color = MyGameTheme.colors.inkMuted,
                modifier = Modifier.alignByBaseline(),
            )
        }
    }
}

@StringRes
private fun statusOf(state: SchoolUiState.LessonState): Int? = when (state) {
    SchoolUiState.LessonState.Studied -> R.string.school_lesson_studied
    SchoolUiState.LessonState.Studying -> R.string.school_lesson_studying
    is SchoolUiState.LessonState.Open -> null
}
