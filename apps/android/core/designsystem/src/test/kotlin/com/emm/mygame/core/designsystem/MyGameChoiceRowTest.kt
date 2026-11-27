package com.emm.mygame.core.designsystem

import androidx.compose.ui.test.assertHeightIsAtLeast
import androidx.compose.ui.test.getBoundsInRoot
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isSelectable
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.unit.DpRect
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

private const val DP_TOLERANCE: Float = 1f

@RunWith(RobolectricTestRunner::class)
class MyGameChoiceRowTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private fun show(look: MyGameChoiceLook) {
        composeRule.setContent {
            MyGameTheme {
                MyGameChoiceRow(label = "Spanish", isChosen = true, isEnabled = true, onClick = {}, look = look)
            }
        }
    }

    @Test
    fun `keeps a setting choice row at least 56 dp tall`() {
        show(MyGameChoiceLook.Setting)

        composeRule
            .onNode(isSelectable() and hasText("Spanish"))
            .assertHeightIsAtLeast(MyGameSizes.control + MyGameSpacing.step2)
    }

    @Test
    fun `pads a setting choice row above and below its label`() {
        show(MyGameChoiceLook.Setting)

        val row: DpRect = composeRule.onNode(isSelectable() and hasText("Spanish")).getBoundsInRoot()
        val label: DpRect = composeRule.onNodeWithText("Spanish", useUnmergedTree = true).getBoundsInRoot()

        assertEquals((row.top - label.top).value, (label.bottom - row.bottom).value, DP_TOLERANCE)
        assertEquals(true, label.top - row.top >= MyGameSpacing.step2)
    }

    @Test
    fun `keeps an answer choice row at the secondary height`() {
        show(MyGameChoiceLook.Answer)

        composeRule.onNode(isSelectable() and hasText("Spanish")).assertHeightIsAtLeast(MyGameSizes.secondary)
    }
}
