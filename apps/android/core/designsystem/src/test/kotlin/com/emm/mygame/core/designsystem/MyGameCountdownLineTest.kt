package com.emm.mygame.core.designsystem

import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.text.TextStyle
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class MyGameCountdownLineTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    @Test
    fun `draws the time in title with tabular figures`() {
        composeRule.setContent {
            MyGameTheme {
                MyGameCountdownLine(words = "Ready in", time = "12:40", ground = MyGameCountdownGround.Paper)
            }
        }

        val time: TextStyle = styleOf("12:40")
        assertEquals(MyGameTypography.title.fontSize, time.fontSize)
        assertEquals(MyGameTypography.title.fontWeight, time.fontWeight)
        assertEquals("tnum", time.fontFeatureSettings)
    }

    private fun styleOf(text: String): TextStyle {
        val layouts: MutableList<TextLayoutResult> = mutableListOf()
        composeRule.onNodeWithText(text, useUnmergedTree = true).fetchSemanticsNode()
            .config[SemanticsActions.GetTextLayoutResult].action?.invoke(layouts)
        return layouts.single().layoutInput.style
    }
}
