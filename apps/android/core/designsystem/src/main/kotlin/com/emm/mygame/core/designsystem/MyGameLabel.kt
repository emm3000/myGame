package com.emm.mygame.core.designsystem

import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
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
    Column(horizontalAlignment = alignmentOf(style.textAlign), modifier = modifier) {
        MyGameText(text = label.text, style = style, color = color)
        MyGameText(text = translation, style = translationStyleOf(style), color = color)
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
            busyDescription = "Waiting",
            onClick = {},
        )
        MyGameOutlinedButton(
            label = MyGameLabel(text = "Close the news", translation = "Cerrar las noticias"),
            isBusy = false,
            busyDescription = "Waiting",
            onClick = {},
        )
        MyGameTextLink(label = MyGameLabel(text = "All the news", translation = "Todas las noticias"), onClick = {})
        MyGameBackLink(label = MyGameLabel(text = "Town", translation = "Pueblo"), isEnabled = true, onClick = {})
    }
}
