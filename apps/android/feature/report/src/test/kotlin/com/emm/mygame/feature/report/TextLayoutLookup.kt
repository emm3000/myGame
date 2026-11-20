package com.emm.mygame.feature.report

import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.text.TextLayoutResult

internal fun layoutOf(node: SemanticsNodeInteraction): TextLayoutResult {
    val layouts: MutableList<TextLayoutResult> = mutableListOf()
    node.fetchSemanticsNode().config[SemanticsActions.GetTextLayoutResult].action?.invoke(layouts)
    return layouts.single()
}
