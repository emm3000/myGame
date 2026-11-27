package com.emm.mygame.core.uitesting

import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.SemanticsNodeInteractionsProvider
import androidx.compose.ui.test.hasText
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.text.TextStyle

fun textStyleOf(nodes: SemanticsNodeInteractionsProvider, text: String): TextStyle =
    textStyleOf(nodes, hasText(text))

fun textStyleOf(nodes: SemanticsNodeInteractionsProvider, matcher: SemanticsMatcher): TextStyle {
    val results: MutableList<TextLayoutResult> = mutableListOf()
    nodes.onNode(matcher, useUnmergedTree = true).fetchSemanticsNode()
        .config[SemanticsActions.GetTextLayoutResult].action?.invoke(results)
    return results.first().layoutInput.style
}
