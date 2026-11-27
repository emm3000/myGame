package com.emm.mygame.core.ui

import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.text.TextStyle
import com.emm.mygame.core.designsystem.text.MyGameLabel
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.MyGameTypography
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class SchoolPathLabelTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private fun stepOf(english: String, spanish: String, count: Int): SchoolPathSteps.Step = SchoolPathSteps.Step(
        label = MyGameLabel(text = english, translation = spanish),
        count = MyGameLabel(text = "$count of 5", translation = "$count de 5"),
    )

    private fun showBothPhasePath() {
        composeRule.setContent {
            MyGameTheme {
                SchoolPath(
                    steps = SchoolPathSteps(
                        studied = stepOf(english = "Studied", spanish = "Estudiadas", count = 5),
                        read = stepOf(english = "Can read", spanish = "Puedes leer", count = 4),
                        reviewed = stepOf(english = "Reviewed", spanish = "Repasadas", count = 3),
                        learned = stepOf(english = "Learned", spanish = "Aprendidas", count = 2),
                    ),
                )
            }
        }
    }

    @Test
    fun `draws a step's translated label as English over its Spanish translation line`() {
        showBothPhasePath()

        assertTrue(bottomOf("Studied") <= topOf("Estudiadas"))
    }

    @Test
    fun `draws a step's translated count as English over a Spanish line in the translation style`() {
        showBothPhasePath()

        assertTrue(bottomOf("3 of 5") <= topOf("3 de 5"))
        assertEquals(MyGameTypography.body.fontSize, styleOf("3 of 5").fontSize)
        assertEquals(MyGameTypography.caption.fontSize, styleOf("3 de 5").fontSize)
    }

    private fun bottomOf(text: String): Float =
        composeRule.onNodeWithText(text, useUnmergedTree = true).getUnclippedBoundsInRoot().bottom.value

    private fun topOf(text: String): Float =
        composeRule.onNodeWithText(text, useUnmergedTree = true).getUnclippedBoundsInRoot().top.value

    private fun styleOf(text: String): TextStyle {
        val layouts: MutableList<TextLayoutResult> = mutableListOf()
        composeRule.onNodeWithText(text, useUnmergedTree = true).fetchSemanticsNode()
            .config[SemanticsActions.GetTextLayoutResult].action?.invoke(layouts)
        return layouts.single().layoutInput.style
    }
}
