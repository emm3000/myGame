package com.emm.mygame.feature.account

import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isHeading
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.text.TextStyle

internal fun textStyleOf(composeRule: ComposeContentTestRule, text: String): TextStyle {
    val results: MutableList<TextLayoutResult> = mutableListOf()
    composeRule.onNode(hasText(text) and isHeading(), useUnmergedTree = true).fetchSemanticsNode()
        .config[SemanticsActions.GetTextLayoutResult].action?.invoke(results)
    return results.first().layoutInput.style
}
