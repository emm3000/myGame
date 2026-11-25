package com.emm.mygame.feature.learning.reviews

import androidx.annotation.StringRes
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.buildAnnotatedString
import com.emm.mygame.core.designsystem.MyGameRegisteredRow
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.englishTextOf
import com.emm.mygame.core.designsystem.formatQuantity
import com.emm.mygame.core.designsystem.registering
import com.emm.mygame.core.designsystem.rememberRegisteredFraction
import com.emm.mygame.core.designsystem.withTabularFigures
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.ui.CopyReader
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.rememberPlayerCopy
import com.emm.mygame.feature.learning.R

@Composable
internal fun SkillEarned(skill: ReviewUiState.SkillLine, modifier: Modifier = Modifier) {
    val copy: PlayerCopy = rememberPlayerCopy()
    val resourceName: Int = skillResourceNameOf(skill.resource)
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1), modifier = modifier) {
        MyGameText(
            text = copy.fixedCopy {
                text(R.string.review_skill_earned, "resource" to text(resourceName), "level" to skill.level.toString())
            },
            style = MyGameTypography.title,
            color = MyGameTheme.colors.ink,
        )
        MyGameText(
            text = copy.fixedCopy {
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
    append(englishTextOf(words.joinToString(", ")))
}

@StringRes
private fun skillResourceNameOf(resource: TownResourceKind): Int = when (resource) {
    TownResourceKind.Money -> R.string.review_skill_resource_money
    TownResourceKind.Food -> R.string.review_skill_resource_food
    TownResourceKind.Power -> R.string.review_skill_resource_power
    TownResourceKind.Material -> R.string.review_skill_resource_material
}
