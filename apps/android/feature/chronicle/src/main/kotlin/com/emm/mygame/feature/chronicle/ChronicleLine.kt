package com.emm.mygame.feature.chronicle

import android.content.res.Resources
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.InlineTextContent
import androidx.compose.foundation.text.appendInlineContent
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalResources
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.text
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.Placeholder
import androidx.compose.ui.text.PlaceholderVerticalAlign
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Density
import com.emm.mygame.core.designsystem.MyGameColors
import com.emm.mygame.core.designsystem.MyGameIcon
import com.emm.mygame.core.designsystem.MyGameIcons
import com.emm.mygame.core.designsystem.MyGameInlineContent
import com.emm.mygame.core.designsystem.MyGameSizes
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.network.ChronicleEvent
import com.emm.mygame.core.network.ResourceKind
import com.emm.mygame.core.ui.getIcuString

@Composable
internal fun ChronicleLine(line: ChronicleInstant, event: ChronicleEvent, modifier: Modifier = Modifier) {
    val resources: Resources = LocalResources.current
    val amounts: String? = resources.amountsOf(event)
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
        modifier = modifier
            .fillMaxWidth()
            .semantics(mergeDescendants = true) { }
            .padding(vertical = MyGameSpacing.step3),
    ) {
        MyGameText(
            text = resources.instantLabelOf(line),
            style = MyGameTypography.label,
            color = MyGameTheme.colors.inkMuted,
        )
        MyGameText(text = resources.sentenceOf(event), style = MyGameTypography.body, color = MyGameTheme.colors.ink)
        if (amounts != null) {
            AmountsSentence(sentence = amounts, event = event)
        }
    }
}

@Composable
private fun AmountsSentence(sentence: String, event: ChronicleEvent, modifier: Modifier = Modifier) {
    val marks: List<AmountMark> = LocalResources.current.amountMarksOf(event)
    val colors: MyGameColors = MyGameTheme.colors
    val density: Density = LocalDensity.current
    val icons: MyGameInlineContent = remember(marks, colors, density) { inlineIconsOf(marks, colors, density) }
    MyGameText(
        text = sentenceWithIcons(sentence, marks),
        style = MyGameTypography.body,
        color = colors.inkMuted,
        inlineContent = icons,
        modifier = modifier.clearAndSetSemantics { text = AnnotatedString(sentence) },
    )
}

private fun inlineIconsOf(marks: List<AmountMark>, colors: MyGameColors, density: Density): MyGameInlineContent {
    val placeholder: Placeholder = Placeholder(
        width = with(density) { (MyGameSizes.icon + MyGameSpacing.step1).toSp() },
        height = with(density) { MyGameSizes.icon.toSp() },
        placeholderVerticalAlign = PlaceholderVerticalAlign.TextCenter,
    )
    return MyGameInlineContent(
        marks.associate { mark: AmountMark ->
            mark.resource.name to InlineTextContent(placeholder) {
                MyGameIcon(
                    icon = iconOf(mark.resource),
                    tint = accentOf(mark.resource, colors),
                    modifier = Modifier.padding(end = MyGameSpacing.step1),
                )
            }
        },
    )
}

private fun sentenceWithIcons(sentence: String, marks: List<AmountMark>): AnnotatedString = buildAnnotatedString {
    var copied: Int = 0
    marks.forEach { mark: AmountMark ->
        append(sentence.substring(copied, mark.start))
        appendInlineContent(mark.resource.name)
        copied = mark.start
    }
    append(sentence.substring(copied))
}

private fun iconOf(resource: ResourceKind): ImageVector = when (resource) {
    ResourceKind.Wood -> MyGameIcons.wood
    ResourceKind.Stone -> MyGameIcons.stone
    ResourceKind.Iron -> MyGameIcons.iron
    ResourceKind.Gold -> MyGameIcons.gold
    ResourceKind.Food -> MyGameIcons.food
}

private fun accentOf(resource: ResourceKind, colors: MyGameColors): Color = when (resource) {
    ResourceKind.Wood -> colors.material
    ResourceKind.Stone -> colors.material
    ResourceKind.Iron -> colors.material
    ResourceKind.Gold -> colors.money
    ResourceKind.Food -> colors.food
}

private fun Resources.sentenceOf(event: ChronicleEvent): AnnotatedString {
    val heading: String = headingOf(event)
    val sentence: String = getIcuString(R.string.chronicle_line, "heading" to heading, "subject" to subjectOf(event))
    return buildAnnotatedString {
        append(sentence)
        addStyle(SpanStyle(fontWeight = FontWeight.Bold), start = 0, end = heading.length)
    }
}
