package com.emm.mygame.feature.fief

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import com.emm.mygame.core.designsystem.MyGameColors
import com.emm.mygame.core.designsystem.MyGameErrorBanner
import com.emm.mygame.core.designsystem.MyGameIcon
import com.emm.mygame.core.designsystem.MyGameIcons
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.designsystem.MyGameRadii
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameStrokeWidths
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.network.ReviewRefusal
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.ui.icuStringResource

internal const val RIGHT_ICON: String = "review_right_icon"

internal const val WRONG_ICON: String = "review_wrong_icon"

@Composable
internal fun ReviewStepLine(
    reviewing: ReviewUiState.Reviewing,
    onIntent: (ReviewIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    when (val step: ReviewUiState.ReviewStep = reviewing.step) {
        ReviewUiState.ReviewStep.Answering,
        ReviewUiState.ReviewStep.Checking,
        ReviewUiState.ReviewStep.Hinting,
        -> Unit
        ReviewUiState.ReviewStep.NearMiss -> NearMissLine(modifier = modifier)
        is ReviewUiState.ReviewStep.Refused ->
            RefusalLine(refusal = step.refusal, onIntent = onIntent, modifier = modifier)
        ReviewUiState.ReviewStep.Unreachable ->
            MyGameInlineAlert(message = stringResource(R.string.fief_unreachable), modifier = modifier)
        is ReviewUiState.ReviewStep.Correct -> CorrectLine(step = step, modifier = modifier)
        is ReviewUiState.ReviewStep.Wrong ->
            WrongLine(yours = reviewing.card.shownAnswer.orEmpty(), correct = step.correct, modifier = modifier)
    }
}

@Composable
private fun RefusalLine(refusal: ReviewRefusal, onIntent: (ReviewIntent) -> Unit, modifier: Modifier = Modifier) {
    val message: String = stringResource(refusalLineOf(refusal))
    if (refusal.asksForAReread()) {
        MyGameErrorBanner(
            message = message,
            actionLabel = stringResource(R.string.fief_retry),
            onAction = { onIntent(ReviewIntent.RetryTapped) },
            modifier = modifier,
        )
    } else {
        MyGameInlineAlert(message = message, modifier = modifier)
    }
}

@Composable
private fun NearMissLine(modifier: Modifier = Modifier) {
    val colors: MyGameColors = MyGameTheme.colors
    val shape: RoundedCornerShape = RoundedCornerShape(MyGameRadii.md)
    MyGameText(
        text = stringResource(R.string.review_near_miss),
        style = MyGameTypography.body,
        color = colors.ink,
        modifier = modifier
            .fillMaxWidth()
            .background(colors.surfaceSunken, shape)
            .border(MyGameStrokeWidths.hairline, colors.ink, shape)
            .padding(horizontal = MyGameSpacing.step3, vertical = MyGameSpacing.step2)
            .semantics { liveRegion = LiveRegionMode.Polite },
    )
}

@Composable
private fun VerdictLine(icon: ImageVector, tag: String, text: String, modifier: Modifier = Modifier) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        modifier = modifier,
    ) {
        MyGameIcon(icon = icon, tint = MyGameTheme.colors.ink, modifier = Modifier.testTag(tag))
        MyGameText(text = text, style = MyGameTypography.title, color = MyGameTheme.colors.ink)
    }
}

@Composable
private fun CorrectLine(step: ReviewUiState.ReviewStep.Correct, modifier: Modifier = Modifier) {
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        modifier = modifier.semantics(mergeDescendants = true) { liveRegion = LiveRegionMode.Polite },
    ) {
        VerdictLine(icon = MyGameIcons.check, tag = RIGHT_ICON, text = stringResource(R.string.review_correct))
        step.skill?.let { skill: ReviewUiState.SkillLine -> SkillEarned(skill = skill) }
    }
}

@Composable
private fun SkillEarned(skill: ReviewUiState.SkillLine, modifier: Modifier = Modifier) {
    val resource: String = stringResource(skillResourceNameOf(skill.resource))
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1), modifier = modifier) {
        MyGameText(
            text = icuStringResource(
                R.string.review_skill_earned,
                "resource" to resource,
                "level" to skill.level.toString(),
            ),
            style = MyGameTypography.title,
            color = MyGameTheme.colors.ink,
        )
        MyGameText(
            text = icuStringResource(
                R.string.review_skill_rate,
                "percent" to percentLabelOf(skill.ratePercent.toDouble()),
                "resource" to resource,
            ),
            style = MyGameTypography.caption,
            color = MyGameTheme.colors.ink,
        )
    }
}

@Composable
private fun WrongLine(yours: String, correct: String, modifier: Modifier = Modifier) {
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        modifier = modifier.semantics(mergeDescendants = true) { liveRegion = LiveRegionMode.Polite },
    ) {
        VerdictLine(icon = MyGameIcons.cross, tag = WRONG_ICON, text = stringResource(R.string.review_wrong))
        MyGameText(
            text = icuStringResource(R.string.review_yours, "answer" to yours),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.ink,
        )
        MyGameText(
            text = withBoldForm(icuStringResource(R.string.review_correct_form, "answer" to correct), correct),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.ink,
        )
        MyGameText(
            text = stringResource(R.string.review_returns),
            style = MyGameTypography.caption,
            color = MyGameTheme.colors.ink,
        )
    }
}

private fun withBoldForm(line: String, form: String): AnnotatedString = buildAnnotatedString {
    append(line)
    val start: Int = line.lastIndexOf(form)
    addStyle(SpanStyle(fontWeight = FontWeight.Bold), start, start + form.length)
}

private fun ReviewRefusal.asksForAReread(): Boolean = when (this) {
    ReviewRefusal.ReviewNotDue,
    ReviewRefusal.UnknownChoice,
    ReviewRefusal.WordNotHeld,
    ReviewRefusal.UnknownWord,
    -> true
    ReviewRefusal.HintOnRecognition, ReviewRefusal.Unrecognized -> false
}

private fun skillResourceNameOf(resource: TownResourceKind): Int = when (resource) {
    TownResourceKind.Money -> R.string.review_skill_resource_money
    TownResourceKind.Food -> R.string.review_skill_resource_food
    TownResourceKind.Power -> R.string.review_skill_resource_power
    TownResourceKind.Material -> R.string.review_skill_resource_material
}

private fun refusalLineOf(refusal: ReviewRefusal): Int = when (refusal) {
    ReviewRefusal.ReviewNotDue -> R.string.review_refusal_not_due
    ReviewRefusal.HintOnRecognition -> R.string.review_refusal_hint_on_recognition
    ReviewRefusal.UnknownChoice -> R.string.review_refusal_unknown_choice
    ReviewRefusal.WordNotHeld, ReviewRefusal.UnknownWord -> R.string.review_refusal_word_not_held
    ReviewRefusal.Unrecognized -> R.string.fief_unreachable
}
