package com.emm.mygame.core.designsystem

import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign

data class MyGameLabel(val text: String, val translation: String?) {

    val spoken: String get() = listOfNotNull(text, translation).joinToString(separator = "\n")

    fun uppercase(): MyGameLabel = MyGameLabel(text = text.uppercase(), translation = translation?.uppercase())
}

@Composable
fun MyGameText(label: MyGameLabel, style: TextStyle, color: Color, modifier: Modifier = Modifier) {
    val translation: String? = label.translation
    if (translation == null) {
        MyGameText(text = label.text, style = style, color = color, modifier = modifier)
        return
    }
    MyGameTranslatedLines(
        text = label.text,
        translation = translation,
        style = style,
        modifier = modifier,
    ) { line: String, lineStyle: TextStyle ->
        MyGameText(text = line, style = lineStyle, color = color)
    }
}

@Composable
fun MyGameText(
    label: MyGameLabel,
    style: TextStyle,
    color: Color,
    styledLineOf: (String) -> AnnotatedString,
    modifier: Modifier = Modifier,
) {
    val translation: String? = label.translation
    if (translation == null) {
        MyGameText(text = styledLineOf(label.text), style = style, color = color, modifier = modifier)
        return
    }
    MyGameTranslatedLines(
        text = label.text,
        translation = translation,
        style = style,
        modifier = modifier,
    ) { line: String, lineStyle: TextStyle ->
        MyGameText(text = styledLineOf(line), style = lineStyle, color = color)
    }
}

// Module helper: every caller passes the modifier, so a default would never be used.
@Suppress("ModifierWithoutDefault")
@Composable
internal fun MyGameTranslatedLines(
    text: String,
    translation: String,
    style: TextStyle,
    modifier: Modifier,
    drawLine: @Composable (line: String, lineStyle: TextStyle) -> Unit,
) {
    Column(horizontalAlignment = alignmentOf(style.textAlign), modifier = modifier) {
        val lines: List<Pair<String, TextStyle>> = listOf(text to style, translation to translationStyleOf(style))
        lines.forEach { (line: String, lineStyle: TextStyle) -> drawLine(line, lineStyle) }
    }
}

private fun translationStyleOf(style: TextStyle): TextStyle =
    MyGameTypography.caption.copy(textAlign = style.textAlign, textDecoration = style.textDecoration)

private fun alignmentOf(textAlign: TextAlign): Alignment.Horizontal = when (textAlign) {
    TextAlign.Center -> Alignment.CenterHorizontally
    TextAlign.End, TextAlign.Right -> Alignment.End
    else -> Alignment.Start
}

@PreviewMyGame
@Composable
private fun MyGameLabelPreview() {
    MyGamePreviewSurface {
        MyGameText(
            label = MyGameLabel(text = "Report", translation = "Informe"),
            style = MyGameTypography.display,
            color = MyGameTheme.colors.ink,
        )
        MyGameButton(
            label = MyGameLabel(text = "Start reviews", translation = "Empezar a repasar"),
            isBusy = false,
            busyDescription = MyGameLabel(text = "Waiting", translation = null),
            onClick = {},
        )
        MyGameOutlinedButton(
            label = MyGameLabel(text = "Close the news", translation = "Cerrar las noticias"),
            isBusy = false,
            busyDescription = MyGameLabel(text = "Waiting", translation = null),
            onClick = {},
        )
        MyGameTextLink(label = MyGameLabel(text = "All the news", translation = "Todas las noticias"), onClick = {})
        MyGameBackLink(label = MyGameLabel(text = "Town", translation = "Pueblo"), isEnabled = true, onClick = {})
    }
}

@PreviewMyGame
@Composable
private fun MyGameLabelStyledLinesPreview() {
    MyGamePreviewSurface {
        MyGameText(
            label = MyGameLabel(text = "Ready tomorrow 09:30", translation = "Lista mañana 09:30"),
            style = MyGameTypography.caption,
            color = MyGameTheme.colors.inkMuted,
            styledLineOf = ::boldFiguresOf,
        )
    }
}

private val previewFigure: Regex = Regex("\\d+")

private fun boldFiguresOf(line: String): AnnotatedString = buildAnnotatedString {
    append(line)
    previewFigure.findAll(line).forEach { match: MatchResult ->
        addStyle(SpanStyle(fontWeight = FontWeight.Bold), start = match.range.first, end = match.range.last + 1)
    }
}
