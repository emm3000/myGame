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
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTag
import com.emm.mygame.core.designsystem.MyGameHairline
import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.designsystem.MyGameOutlinedButton
import com.emm.mygame.core.designsystem.MyGameSizes
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.SchoolPathCounts
import com.emm.mygame.core.ui.SchoolPath
import com.emm.mygame.core.ui.SchoolPathSteps
import com.emm.mygame.core.ui.SeasonMark
import com.emm.mygame.core.ui.CopyReader
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.rememberPlayerCopy

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
    val nextStepLesson: LessonId? = content.nextStepReleasedLesson
    val releasedCards: List<SchoolUiState.ReleasedLessonCard> =
        content.releasedLessons.filter { card: SchoolUiState.ReleasedLessonCard -> card.lesson != nextStepLesson }
    if (cards.isEmpty() && releasedCards.isEmpty()) return
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1), modifier = modifier) {
        MyGameText(
            label = chromeResource(R.string.school_lessons),
            style = MyGameTypography.heading,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { heading() },
        )
        content.studyMark?.let { mark: SchoolUiState.DurationMark -> StudyMarkRow(mark = mark) }
        cards.forEachIndexed { index: Int, card: SchoolUiState.LessonCard ->
            if (index > 0) MyGameHairline()
            LessonRow(card = card, onIntent = onIntent)
        }
        releasedCards.forEachIndexed { index: Int, card: SchoolUiState.ReleasedLessonCard ->
            if (index > 0 || cards.isNotEmpty()) MyGameHairline()
            ReleasedLessonRow(card = card, start = content.start, onIntent = onIntent)
        }
    }
}

@Composable
private fun StudyMarkRow(mark: SchoolUiState.DurationMark, modifier: Modifier = Modifier) {
    SeasonMark(
        icon = seasonIconOf(mark.season),
        label = chromeResource(
            R.string.school_season_study_mark,
            "season" to seasonSelectorOf(mark.season),
            "percent" to mark.percent.toString(),
        ),
        modifier = modifier,
    )
}

@Composable
private fun ReleasedLessonRow(
    card: SchoolUiState.ReleasedLessonCard,
    start: SchoolUiState.LessonRequest,
    onIntent: (SchoolIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val copy: PlayerCopy = rememberPlayerCopy()
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
            LessonHeading(title = copy.lessonTitleOf(card.name), state = card.state)
            MyGameText(
                label = copy.chrome(R.string.school_lesson_words, "count" to card.wordCount),
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
    val copy: PlayerCopy = rememberPlayerCopy()
    val reason: MyGameLabel? = block?.let { blocked: SchoolUiState.LessonBlock -> copy.blockLineOf(blocked) }
    val action: String = copy.fixedCopy(R.string.school_released_lesson_study)
    val studyLine: CopyReader.() -> String = {
        text(R.string.school_study_with_duration, "action" to action, "duration" to durationLabelOf(card.duration))
    }
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameOutlinedButton(
            label = copy.chrome(studyLine),
            isBusy = start == SchoolUiState.LessonRequest.Waiting,
            busyDescription = copy.chrome(R.string.school_waiting).spoken,
            onClick = { onIntent(SchoolIntent.StudyTapped(card.lesson)) },
            blockedReason = reason?.spoken,
            accessibleName = copy.lessonLineOf(card.name) { title: String -> "$title · ${studyLine()}" }.spoken,
        )
        reason?.let { line: MyGameLabel -> BlockLine(line = line) }
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
    val copy: PlayerCopy = rememberPlayerCopy()
    SchoolPath(
        steps = SchoolPathSteps(
            studied = copy.pathStepOf(R.string.school_path_studied, path.held, path.held),
            read = copy.pathStepOf(R.string.school_path_read, path.read, path.held),
            reviewed = copy.pathStepOf(R.string.school_path_reviewed, path.reviewed, path.held),
            learned = copy.pathStepOf(R.string.school_path_learned, path.learned, path.held),
        ),
        modifier = modifier,
    )
}

private fun PlayerCopy.pathStepOf(@StringRes label: Int, count: Int, total: Int): SchoolPathSteps.Step =
    SchoolPathSteps.Step(
        label = chrome(label).spoken,
        count = chrome(R.string.school_path_count, "count" to count.toString(), "total" to total.toString()).spoken,
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
    val copy: PlayerCopy = rememberPlayerCopy()
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
        modifier = modifier
            .fillMaxWidth()
            .then(target)
            .padding(vertical = MyGameSpacing.step3),
    ) {
        LessonHeading(
            title = copy.chrome(R.string.school_lesson_title, "number" to card.number.toString()),
            state = card.state,
        )
        MyGameText(text = card.theme, style = MyGameTypography.body, color = MyGameTheme.colors.ink)
        MyGameText(
            label = copy.chrome { lessonSummaryOf(card) },
            style = MyGameTypography.caption,
            color = MyGameTheme.colors.inkMuted,
        )
    }
}

@Composable
private fun LessonHeading(title: MyGameLabel, state: SchoolUiState.LessonState, modifier: Modifier = Modifier) {
    Row(horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        MyGameText(
            label = title,
            style = MyGameTypography.title,
            color = MyGameTheme.colors.ink,
            modifier = Modifier
                .weight(1f, fill = false)
                .alignByBaseline(),
        )
        statusOf(state)?.let { status: Int ->
            MyGameText(
                label = chromeResource(status),
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
