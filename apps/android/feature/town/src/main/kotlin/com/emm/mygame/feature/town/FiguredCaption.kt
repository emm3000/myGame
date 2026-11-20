package com.emm.mygame.feature.town

import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.buildAnnotatedString
import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.withTabularFigures

@Composable
internal fun FiguredCaption(label: MyGameLabel, color: Color, modifier: Modifier = Modifier) {
    Column(modifier = modifier) {
        listOfNotNull(label.text, label.translation).forEach { line: String ->
            MyGameText(text = tabularFiguresOf(line), style = MyGameTypography.caption, color = color)
        }
    }
}

private val figure: Regex = Regex("\\d+(?:[:\u202F]\\d+)*")

private val tabularFigures: SpanStyle =
    SpanStyle(fontFeatureSettings = TextStyle.Default.withTabularFigures().fontFeatureSettings)

private fun tabularFiguresOf(line: String): AnnotatedString = buildAnnotatedString {
    append(line)
    figure.findAll(line).forEach { match: MatchResult ->
        addStyle(tabularFigures, start = match.range.first, end = match.range.last + 1)
    }
}
