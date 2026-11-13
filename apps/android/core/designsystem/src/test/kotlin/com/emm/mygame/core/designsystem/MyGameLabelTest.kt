package com.emm.mygame.core.designsystem

import androidx.compose.runtime.Composable
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertHeightIsAtLeast
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.DpRect
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class MyGameLabelTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val startReviews: MyGameLabel = MyGameLabel(text = "Start reviews", translation = "Empezar a repasar")

    private fun show(content: @Composable () -> Unit) {
        composeRule.setContent {
            MyGameTheme {
                content()
            }
        }
    }

    @Test
    fun `draws a translated ink pill as English over Spanish inside its action height`() {
        show { MyGameButton(label = startReviews, isBusy = false, busyDescription = "Waiting", onClick = {}) }

        assertEnglishOverSpanish(within = composeRule.onNodeWithTag(INK_PILL).getUnclippedBoundsInRoot())
        composeRule.onNodeWithTag(INK_PILL).assertHeightIsAtLeast(MyGameSizes.action)
    }

    @Test
    fun `draws a translated outlined pill as English over Spanish inside its secondary height`() {
        show { MyGameOutlinedButton(label = startReviews, isBusy = false, busyDescription = "Waiting", onClick = {}) }

        assertEnglishOverSpanish(within = composeRule.onNodeWithTag(OUTLINED_PILL).getUnclippedBoundsInRoot())
        composeRule.onNodeWithTag(OUTLINED_PILL).assertHeightIsAtLeast(MyGameSizes.secondary)
    }

    @Test
    fun `draws a translated text button as English over Spanish inside its control height`() {
        show { MyGameTextButton(label = startReviews, isBusy = false, busyDescription = "Waiting", onClick = {}) }

        assertEnglishOverSpanish(within = composeRule.onNodeWithText("Start reviews").getUnclippedBoundsInRoot())
        composeRule.onNodeWithText("Start reviews").assertHeightIsAtLeast(MyGameSizes.control)
    }

    @Test
    fun `draws a translated text link as English over Spanish inside its control height`() {
        show { MyGameTextLink(label = startReviews, onClick = {}) }

        assertEnglishOverSpanish(within = composeRule.onNodeWithText("Start reviews").getUnclippedBoundsInRoot())
        composeRule.onNodeWithText("Start reviews").assertHeightIsAtLeast(MyGameSizes.control)
    }

    @Test
    fun `draws a translated back link as English over Spanish inside its control height`() {
        show { MyGameBackLink(label = MyGameLabel("Town", "Pueblo"), isEnabled = true, onClick = {}) }

        val englishLine: DpRect = unmerged("TOWN")
        val spanishLine: DpRect = unmerged("PUEBLO")
        assertTrue(englishLine.bottom <= spanishLine.top)
        composeRule.onNodeWithText("TOWN").assertHeightIsAtLeast(MyGameSizes.control)
    }

    @Test
    fun `draws an untranslated label on one line`() {
        show {
            MyGameButton(
                label = MyGameLabel(text = "Start reviews", translation = null),
                isBusy = false,
                busyDescription = "Waiting",
                onClick = {},
            )
        }

        composeRule.onAllNodesWithText("Start reviews", useUnmergedTree = true).assertCountEquals(1)
        composeRule.onAllNodesWithText("Empezar a repasar", useUnmergedTree = true).assertCountEquals(0)
    }

    private fun assertEnglishOverSpanish(within: DpRect) {
        val englishLine: DpRect = unmerged("Start reviews")
        val spanishLine: DpRect = unmerged("Empezar a repasar")
        assertTrue(englishLine.bottom <= spanishLine.top)
        assertTrue(within.contains(englishLine) && within.contains(spanishLine))
    }

    private fun unmerged(text: String): DpRect =
        composeRule.onNodeWithText(text, useUnmergedTree = true).getUnclippedBoundsInRoot()
}

private fun DpRect.contains(inner: DpRect): Boolean =
    inner.left >= left - tolerance && inner.right <= right + tolerance &&
        inner.top >= top - tolerance && inner.bottom <= bottom + tolerance

private val tolerance: Dp = Dp(0.5f)
