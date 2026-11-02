package com.emm.mygame.core.designsystem

import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.TextStyle

@Composable
fun MyGameText(text: String, style: TextStyle, color: Color, modifier: Modifier = Modifier) {
    BasicText(text = text, style = style.copy(color = color), modifier = modifier)
}

@Composable
fun MyGameText(text: AnnotatedString, style: TextStyle, color: Color, modifier: Modifier = Modifier) {
    BasicText(text = text, style = style.copy(color = color), modifier = modifier)
}
