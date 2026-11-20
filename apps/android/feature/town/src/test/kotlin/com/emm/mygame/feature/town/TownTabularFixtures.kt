package com.emm.mygame.feature.town

import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextLayoutResult

private const val TNUM_FEATURE: String = "tnum"

internal fun ComposeContentTestRule.tabularRunsOf(shownText: String): List<String> {
    val layouts: MutableList<TextLayoutResult> = mutableListOf()
    onNodeWithText(shownText, substring = true, useUnmergedTree = true).fetchSemanticsNode()
        .config[SemanticsActions.GetTextLayoutResult].action?.invoke(layouts)
    val layout: TextLayoutResult = layouts.single()
    val text: AnnotatedString = layout.layoutInput.text
    if (layout.layoutInput.style.fontFeatureSettings == TNUM_FEATURE) return listOf(text.text)
    return text.spanStyles
        .filter { span: AnnotatedString.Range<SpanStyle> -> span.item.fontFeatureSettings == TNUM_FEATURE }
        .map { span: AnnotatedString.Range<SpanStyle> -> text.text.substring(span.start, span.end) }
}
