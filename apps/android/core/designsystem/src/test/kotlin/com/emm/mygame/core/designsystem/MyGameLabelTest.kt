package com.emm.mygame.core.designsystem

import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertHeightIsAtLeast
import androidx.compose.ui.test.assertTextEquals
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isHeading
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithContentDescription
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

    @Test
    fun `draws a translated section title as English over Spanish`() {
        show { MyGameSectionTitle(label = startReviews) }

        assertTrue(unmerged("Start reviews").bottom <= unmerged("Empezar a repasar").top)
    }

    @Test
    fun `reads a translated section title as one heading in both languages`() {
        show { MyGameSectionTitle(label = startReviews) }

        composeRule.onNode(isHeading()).assertTextEquals("Start reviews", "Empezar a repasar")
    }

    @Test
    fun `draws an untranslated section title as one heading line`() {
        show { MyGameSectionTitle(text = "Start reviews") }

        composeRule.onAllNodesWithText("Start reviews", useUnmergedTree = true).assertCountEquals(1)
        composeRule.onNode(isHeading() and hasText("Start reviews")).assertExists()
    }

    @Test
    fun `draws a translated next step as English over Spanish for its title, line and detail`() {
        show {
            MyGameNextStepBlock(
                title = MyGameLabel(text = "Next step", translation = "Siguiente paso"),
                line = startReviews,
                detail = MyGameLabel(text = "Five words wait.", translation = "Te esperan cinco palabras."),
            )
        }

        assertTrue(unmerged("NEXT STEP").bottom <= unmerged("SIGUIENTE PASO").top)
        assertTrue(unmerged("Start reviews").bottom <= unmerged("Empezar a repasar").top)
        assertTrue(unmerged("Five words wait.").bottom <= unmerged("Te esperan cinco palabras.").top)
    }

    @Test
    fun `draws an untranslated next step with one line each for its title, line and detail`() {
        show { MyGameNextStepBlock(title = "Next step", line = "Start reviews", detail = "Five words wait.") }

        listOf("NEXT STEP", "Start reviews", "Five words wait.").forEach { line: String ->
            composeRule.onAllNodesWithText(line, useUnmergedTree = true).assertCountEquals(1)
        }
        composeRule.onNode(isHeading() and hasText("NEXT STEP"), useUnmergedTree = true).assertExists()
    }

    @Test
    fun `reads a translated field's label once, English then Spanish`() {
        show { FieldLabelled(label = MyGameLabel(text = "Your answer", translation = "Tu respuesta")) }

        composeRule.onAllNodesWithContentDescription("Your answer\nTu respuesta").assertCountEquals(1)
        composeRule.onAllNodesWithText("Your answer").assertCountEquals(0)
        composeRule.onAllNodesWithText("Tu respuesta").assertCountEquals(0)
    }

    @Test
    fun `keeps an untranslated field's label as its drawn line and its description`() {
        show { FieldLabelled(label = MyGameLabel(text = "Your answer", translation = null)) }

        composeRule.onAllNodesWithText("Your answer", useUnmergedTree = true).assertCountEquals(1)
        composeRule.onAllNodesWithContentDescription("Your answer").assertCountEquals(1)
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

@Composable
private fun FieldLabelled(label: MyGameLabel) {
    MyGameTextField(
        value = "",
        label = label,
        isSecret = false,
        isReadOnly = false,
        keyboardOptions = KeyboardOptions.Default,
        onValueChange = {},
    )
}

private fun DpRect.contains(inner: DpRect): Boolean =
    inner.left >= left - tolerance && inner.right <= right + tolerance &&
        inner.top >= top - tolerance && inner.bottom <= bottom + tolerance

private val tolerance: Dp = Dp(0.5f)
