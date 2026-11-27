package com.emm.mygame.core.designsystem

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertHeightIsEqualTo
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.style.TextDecoration
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class MyGameControlsTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private var taps: Int = 0

    private fun show(content: @Composable () -> Unit) {
        composeRule.setContent {
            MyGameTheme {
                content()
            }
        }
    }

    @Test
    fun `gives the back link control height`() {
        show { MyGameBackLink(label = "Town", isEnabled = true, onClick = {}) }

        composeRule.onNodeWithText("Town").assertHeightIsEqualTo(MyGameSizes.control)
    }

    @Test
    fun `gives a text link control height`() {
        show { MyGameTextLink(label = "Try again", onClick = {}) }

        composeRule.onNodeWithText("Try again").assertHeightIsEqualTo(MyGameSizes.control)
    }

    @Test
    fun `gives the ink pill action height`() {
        show { MyGameButton(label = "Study", isBusy = false, busyDescription = "Waiting", onClick = {}) }

        composeRule.onNodeWithTag(INK_PILL).assertHeightIsEqualTo(MyGameSizes.action)
    }

    @Test
    fun `gives an outlined pill secondary height`() {
        show { MyGameOutlinedButton(label = "School", isBusy = false, busyDescription = "Waiting", onClick = {}) }

        composeRule.onNodeWithTag(OUTLINED_PILL).assertHeightIsEqualTo(MyGameSizes.secondary)
    }

    @Test
    fun `reads a meta label to TalkBack in its original case`() {
        show { MyGameMetaText(text = "Riverton", color = MyGameTheme.colors.inkMuted) }

        composeRule.onNodeWithText("RIVERTON").assert(hasContentDescription("Riverton"))
    }

    @Test
    fun `refuses a tap on a disabled back link`() {
        show { MyGameBackLink(label = "Town", isEnabled = false, onClick = { taps += 1 }) }

        composeRule.onNodeWithText("Town").assertIsNotEnabled().performClick()

        assertEquals(0, taps)
    }

    @Test
    fun `draws a text link's label underlined in ink`() {
        show { MyGameTextLink(label = "Try again", onClick = {}) }

        assertEquals(
            MyGameTypography.label.copy(color = lightColors.ink, textDecoration = TextDecoration.Underline),
            styleOf("Try again"),
        )
    }

    @Test
    fun `announces a busy text link as a disabled button with its busy description`() {
        show { MyGameTextLink(label = "Sign out", isBusy = true, busyDescription = "Signing out", onClick = {}) }

        composeRule
            .onNodeWithContentDescription("Sign out")
            .assertIsNotEnabled()
            .assert(SemanticsMatcher.expectValue(SemanticsProperties.Role, Role.Button))
            .assert(SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, "Signing out"))
    }

    @Test
    fun `draws the working dots and the busy description in place of a busy text link's label`() {
        show { MyGameTextLink(label = "Sign out", isBusy = true, busyDescription = "Signing out", onClick = {}) }

        composeRule.onNodeWithTag(WORKING_DOTS, useUnmergedTree = true).assertIsDisplayed()
        composeRule.onNodeWithText("Signing out", useUnmergedTree = true).assertIsDisplayed()
        composeRule.onNodeWithText("Sign out", useUnmergedTree = true).assertDoesNotExist()
    }

    @Test
    fun `draws no working dots on a text link at rest`() {
        show { MyGameTextLink(label = "Sign out", isBusy = false, busyDescription = "Signing out", onClick = {}) }

        composeRule.onNodeWithTag(WORKING_DOTS, useUnmergedTree = true).assertDoesNotExist()
    }

    @Test
    fun `refuses a tap on a busy text link`() {
        show {
            MyGameTextLink(label = "Sign out", isBusy = true, busyDescription = "Signing out", onClick = { taps += 1 })
        }

        composeRule.onNodeWithContentDescription("Sign out").performClick()

        assertEquals(0, taps)
    }

    @Test
    fun `refuses a tap on a disabled text link`() {
        show { MyGameTextLink(label = "Turn on the reminder", onClick = { taps += 1 }, isEnabled = false) }

        composeRule.onNodeWithText("Turn on the reminder").assertIsNotEnabled().performClick()

        assertEquals(0, taps)
    }

    @Test
    fun `draws a disabled text link's label in muted ink`() {
        show { MyGameTextLink(label = "Turn on the reminder", onClick = {}, isEnabled = false) }

        assertEquals(lightColors.inkMuted, styleOf("Turn on the reminder").color)
    }

    @Test
    fun `takes a tap on a text link at rest`() {
        show {
            MyGameTextLink(label = "Sign out", isBusy = false, busyDescription = "Signing out", onClick = { taps += 1 })
        }

        composeRule.onNodeWithText("Sign out").assertIsEnabled().performClick()

        assertEquals(1, taps)
    }

    @Test
    fun `announces no state on a text link at rest`() {
        show {
            MyGameTextLink(label = "Sign out", isBusy = false, busyDescription = "Signing out", onClick = {})
        }

        composeRule.onNodeWithText("Sign out")
            .assert(SemanticsMatcher.keyNotDefined(SemanticsProperties.StateDescription))
    }

    @Test
    fun `draws the back link's label in ink`() {
        show { MyGameBackLink(label = "Town", isEnabled = true, onClick = {}) }

        assertEquals(MyGameTypography.label.copy(color = lightColors.ink), styleOf("Town"))
    }

    @Test
    fun `draws a disabled back link's label in muted ink`() {
        show { MyGameBackLink(label = "Town", isEnabled = false, onClick = {}) }

        assertEquals(lightColors.inkMuted, styleOf("Town").color)
    }

    @Test
    fun `draws the back link's text in its own case`() {
        show { MyGameBackLink(label = "Town", isEnabled = true, onClick = {}) }

        composeRule.onAllNodesWithText("TOWN", useUnmergedTree = true).assertCountEquals(0)
        composeRule.onNodeWithText("Town", useUnmergedTree = true).assertExists()
    }

    @Test
    fun `draws no meta text inside the back link`() {
        show { MyGameBackLink(label = "Town", isEnabled = true, onClick = {}) }

        assertNoMetaTextInsideAClickable()
    }

    @Test
    fun `draws no meta text inside a text link`() {
        show { MyGameTextLink(label = "Try again", onClick = {}) }

        assertNoMetaTextInsideAClickable()
    }

    @Test
    fun `draws no meta text inside the error banner's link`() {
        show { MyGameErrorBanner(message = "We could not read your town.", actionLabel = "Try again", onAction = {}) }

        assertNoMetaTextInsideAClickable()
    }

    private fun styleOf(text: String): TextStyle =
        layoutStyleOf(composeRule.onNodeWithText(text, useUnmergedTree = true).fetchSemanticsNode())

    private fun assertNoMetaTextInsideAClickable() {
        val textsInsideAClickable: List<SemanticsNode> = composeRule
            .onAllNodes(
                SemanticsMatcher.keyIsDefined(SemanticsActions.GetTextLayoutResult) and
                    (hasClickAction() or hasAnyAncestor(hasClickAction())),
                useUnmergedTree = true,
            )
            .fetchSemanticsNodes()
        val metaTexts: List<SemanticsNode> = textsInsideAClickable.filter { node: SemanticsNode ->
            layoutStyleOf(node).drawsAsMeta()
        }

        assertTrue("a clickable holds a text", textsInsideAClickable.isNotEmpty())
        assertTrue("no clickable holds a meta text: ${metaTexts.map { it.config }}", metaTexts.isEmpty())
    }

    @Test
    fun `gives the go button the md corners`() {
        show { MyGameButton(label = "Study", isBusy = false, busyDescription = "Waiting", onClick = {}) }

        composeRule
            .onNodeWithTag(INK_PILL)
            .assert(SemanticsMatcher.expectValue(SemanticsProperties.Shape, RoundedCornerShape(MyGameRadii.md)))
    }

    @Test
    fun `gives an outlined button the md corners`() {
        show { MyGameOutlinedButton(label = "School", isBusy = false, busyDescription = "Waiting", onClick = {}) }

        composeRule
            .onNodeWithTag(OUTLINED_PILL)
            .assert(SemanticsMatcher.expectValue(SemanticsProperties.Shape, RoundedCornerShape(MyGameRadii.md)))
    }
}

private fun layoutStyleOf(node: SemanticsNode): TextStyle {
    val layouts: MutableList<TextLayoutResult> = mutableListOf()
    node.config[SemanticsActions.GetTextLayoutResult].action?.invoke(layouts)
    return layouts.single().layoutInput.style
}

private fun TextStyle.drawsAsMeta(): Boolean =
    fontSize == MyGameTypography.meta.fontSize && letterSpacing == MyGameTypography.meta.letterSpacing
