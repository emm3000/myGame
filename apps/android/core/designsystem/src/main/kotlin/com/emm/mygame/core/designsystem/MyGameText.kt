package com.emm.mygame.core.designsystem

import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.text.InlineTextContent
import androidx.compose.foundation.text.appendInlineContent
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.Placeholder
import androidx.compose.ui.text.PlaceholderVerticalAlign
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.em

@Composable
fun MyGameText(text: String, style: TextStyle, color: Color, modifier: Modifier = Modifier) {
    BasicText(text = text, style = style.copy(color = color), modifier = modifier)
}

@Composable
fun MyGameText(
    text: AnnotatedString,
    style: TextStyle,
    color: Color,
    modifier: Modifier = Modifier,
    inlineContent: MyGameInlineContent = noInlineContent,
) {
    BasicText(text = text, style = style.copy(color = color), modifier = modifier, inlineContent = inlineContent.byId)
}

@PreviewMyGame
@Composable
private fun MyGameTextPreview() {
    MyGamePreviewSurface {
        MyGameText(text = "Maple Hollow", style = MyGameTypography.title, color = MyGameTheme.colors.ink)
        MyGameText(text = "The bakery opens at seven.", style = MyGameTypography.body, color = MyGameTheme.colors.ink)
        MyGameText(
            text = buildAnnotatedString {
                append("Say ")
                withStyle(SpanStyle(fontWeight = FontWeight.Bold)) { append("harvest") }
                append(" out loud.")
            },
            style = MyGameTypography.body,
            color = MyGameTheme.colors.inkMuted,
        )
    }
}

private const val MONEY_ICON_ID: String = "money"

private val previewInlineContent: MyGameInlineContent = MyGameInlineContent(
    byId = mapOf(
        MONEY_ICON_ID to InlineTextContent(
            placeholder = Placeholder(
                width = 1.em,
                height = 1.em,
                placeholderVerticalAlign = PlaceholderVerticalAlign.Center,
            ),
        ) { _: String -> MyGameIcon(icon = MyGameIcons.money, tint = MyGameTheme.colors.ink) },
    ),
)

@PreviewMyGame
@Composable
private fun MyGameTextInlineContentPreview() {
    MyGamePreviewSurface {
        MyGameText(
            text = buildAnnotatedString {
                append("The bakery earns 40 ")
                appendInlineContent(MONEY_ICON_ID, "money")
                append(" an hour.")
            },
            style = MyGameTypography.body,
            color = MyGameTheme.colors.ink,
            inlineContent = previewInlineContent,
        )
    }
}
