package com.emm.mygame.core.designsystem

import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.hasAnyDescendant
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class MyGameAchievementTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val peach: SemanticsMatcher = SemanticsMatcher.expectValue(BLOCK_HUE, MyGameBlockHue.Peach)

    private val seal: SemanticsMatcher = SemanticsMatcher.keyIsDefined(SEAL)

    private fun showAchievement() {
        composeRule.setContent {
            MyGameTheme {
                MyGameAchievement {
                    MyGameText(
                        text = "Farm: now level 2.",
                        style = MyGameTypography.body,
                        color = MyGameTheme.colors.onBlock,
                    )
                }
            }
        }
    }

    @Test
    fun `draws its content on a block-peach block`() {
        showAchievement()

        composeRule.onNode(peach.and(hasAnyDescendant(hasText("Farm: now level 2.")))).assertExists()
    }

    @Test
    fun `opens with a seal before its content`() {
        showAchievement()

        val sealBounds: Rect = composeRule.onNode(seal, useUnmergedTree = true).fetchSemanticsNode().boundsInRoot
        val textBounds: Rect =
            composeRule.onNodeWithText("Farm: now level 2.", useUnmergedTree = true).fetchSemanticsNode().boundsInRoot
        assertTrue(sealBounds.right <= textBounds.left)
    }

    @Test
    fun `offers no control`() {
        showAchievement()

        composeRule.onNode(peach).assert(SemanticsMatcher.keyNotDefined(SemanticsActions.OnClick))
    }
}
