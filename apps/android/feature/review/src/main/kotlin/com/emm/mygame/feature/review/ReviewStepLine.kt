package com.emm.mygame.feature.review

import androidx.annotation.StringRes
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
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.intl.LocaleList
import androidx.compose.ui.text.withStyle
import com.emm.mygame.core.designsystem.MyGameColors
import com.emm.mygame.core.designsystem.MyGameErrorBanner
import com.emm.mygame.core.designsystem.MyGameIcon
import com.emm.mygame.core.designsystem.MyGameIcons
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.designsystem.MyGameRadii
import com.emm.mygame.core.designsystem.MyGameRegisteredRow
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameStrokeWidths
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.formatQuantity
import com.emm.mygame.core.designsystem.registering
import com.emm.mygame.core.designsystem.rememberRegisteredFraction
import com.emm.mygame.core.designsystem.withTabularFigures
import com.emm.mygame.core.network.ReviewRefusal
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.ui.CopyReader
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.fixedCopyResource
import com.emm.mygame.core.ui.rememberPlayerCopy

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
            MyGameInlineAlert(message = fixedCopyResource(R.string.review_unreachable), modifier = modifier)
        is ReviewUiState.ReviewStep.Correct -> CorrectLine(step = step, modifier = modifier)
        is ReviewUiState.ReviewStep.Wrong ->
            WrongLine(yours = reviewing.card.shownAnswer.orEmpty(), correct = step.correct, modifier = modifier)
    }
}

@Composable
private fun RefusalLine(refusal: ReviewRefusal, onIntent: (ReviewIntent) -> Unit, modifier: Modifier = Modifier) {
    val message: String = fixedCopyResource(refusalLineOf(refusal))
    if (refusal.asksForAReread()) {
        MyGameErrorBanner(
            message = message,
            actionLabel = chromeResource(R.string.review_retry),
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
        text = fixedCopyResource(R.string.review_near_miss),
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
        VerdictLine(icon = MyGameIcons.check, tag = RIGHT_ICON, text = fixedCopyResource(R.string.review_correct))
        step.skill?.let { skill: ReviewUiState.SkillLine -> SkillEarned(skill = skill) }
    }
}

@Composable
private fun SkillEarned(skill: ReviewUiState.SkillLine, modifier: Modifier = Modifier) {
    val copy: PlayerCopy = rememberPlayerCopy()
    val resourceName: Int = skillResourceNameOf(skill.resource)
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1), modifier = modifier) {
        MyGameText(
            label = copy.chrome {
                text(R.string.review_skill_earned, "resource" to text(resourceName), "level" to skill.level.toString())
            },
            style = MyGameTypography.title,
            color = MyGameTheme.colors.ink,
        )
        MyGameText(
            label = copy.chrome {
                text(
                    R.string.review_skill_rate,
                    "percent" to skill.ratePercent.toString(),
                    "resource" to text(resourceName),
                )
            },
            style = MyGameTypography.caption,
            color = MyGameTheme.colors.ink,
        )
        skill.rates?.let { rates: ReviewUiState.SkillRates ->
            RatesLine(line = copy.fixedCopy { ratesLineOf(resourceName, rates) }, rates = rates)
        }
        MyGameText(
            text = wordsLineOf(copy.fixedCopy(R.string.review_skill_words), skill.words),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.ink,
        )
    }
}

@Composable
private fun RatesLine(line: String, rates: ReviewUiState.SkillRates, modifier: Modifier = Modifier) {
    val fraction: Float = rememberRegisteredFraction(MyGameRegisteredRow.Rate, rates)
    MyGameText(
        text = line,
        style = MyGameTypography.body.withTabularFigures(),
        color = MyGameTheme.colors.ink,
        modifier = modifier
            .graphicsLayer { alpha = fraction }
            .registering(MyGameRegisteredRow.Rate, fraction),
    )
}

private fun CopyReader.ratesLineOf(@StringRes resourceName: Int, rates: ReviewUiState.SkillRates): String = text(
    R.string.review_skill_rates,
    "resource" to text(resourceName).replaceFirstChar { first: Char -> first.titlecase(locale) },
    "before" to formatQuantity(rates.before),
    "after" to formatQuantity(rates.after),
)

private fun wordsLineOf(label: String, words: List<String>): AnnotatedString = buildAnnotatedString {
    append(label)
    append(" ")
    withStyle(SpanStyle(localeList = LocaleList("en"))) { append(words.joinToString(", ")) }
}

@Composable
private fun WrongLine(yours: String, correct: String, modifier: Modifier = Modifier) {
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        modifier = modifier.semantics(mergeDescendants = true) { liveRegion = LiveRegionMode.Polite },
    ) {
        VerdictLine(icon = MyGameIcons.cross, tag = WRONG_ICON, text = fixedCopyResource(R.string.review_wrong))
        MyGameText(
            text = fixedCopyResource(R.string.review_yours, "answer" to yours),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.ink,
        )
        MyGameText(
            text = withBoldForm(fixedCopyResource(R.string.review_correct_form, "answer" to correct), correct),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.ink,
        )
        MyGameText(
            text = fixedCopyResource(R.string.review_returns),
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

@StringRes
private fun skillResourceNameOf(resource: TownResourceKind): Int = when (resource) {
    TownResourceKind.Money -> R.string.review_skill_resource_money
    TownResourceKind.Food -> R.string.review_skill_resource_food
    TownResourceKind.Power -> R.string.review_skill_resource_power
    TownResourceKind.Material -> R.string.review_skill_resource_material
}

@StringRes
private fun refusalLineOf(refusal: ReviewRefusal): Int = when (refusal) {
    ReviewRefusal.ReviewNotDue -> R.string.review_refusal_not_due
    ReviewRefusal.HintOnRecognition -> R.string.review_refusal_hint_on_recognition
    ReviewRefusal.UnknownChoice -> R.string.review_refusal_unknown_choice
    ReviewRefusal.WordNotHeld, ReviewRefusal.UnknownWord -> R.string.review_refusal_word_not_held
    ReviewRefusal.Unrecognized -> R.string.review_unreachable
}
