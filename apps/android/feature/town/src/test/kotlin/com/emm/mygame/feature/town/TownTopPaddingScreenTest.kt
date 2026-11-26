package com.emm.mygame.feature.town

import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onFirst
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.unit.Dp
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.PLACE_ART
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class TownTopPaddingScreenTest : TownScreenFixture() {

    @Test
    fun `keeps the smaller top padding to the town home`() {
        show(riverton)

        assertTrue(composeRule.onNodeWithText("Riverton · Pueblo").getUnclippedBoundsInRoot().top < MyGameSpacing.step8)
    }

    @Test
    fun `sets the skeleton under the larger top padding`() {
        showSlowRead()

        val top: Dp = composeRule.onNodeWithContentDescription(READING_LINE).getUnclippedBoundsInRoot().top
        assertEquals(MyGameSpacing.step8.value, top.value, PIXEL_TOLERANCE)
    }

    @Test
    fun `sets a failed read under the larger top padding`() {
        show(TownUiState.Failed)

        val bannerInset: Dp = MyGameSpacing.step3
        assertEquals(
            (MyGameSpacing.step8 + bannerInset).value,
            topOf(UNEXPECTED).value,
            PIXEL_TOLERANCE,
        )
    }

    @Test
    fun `sets the naming form under the larger top padding`() {
        show(emptyNaming())

        val cardInset: Dp = MyGameSpacing.step1 + MyGameSpacing.step4
        assertEquals(
            (MyGameSpacing.step8 + cardInset).value,
            composeRule.onAllNodes(SemanticsMatcher.keyIsDefined(PLACE_ART)).onFirst()
                .getUnclippedBoundsInRoot().top.value,
            PIXEL_TOLERANCE,
        )
    }

    @Test
    fun `sets signing out under the larger top padding`() {
        show(TownUiState.SigningOut)

        assertEquals(MyGameSpacing.step8.value, topOf("Salir").value, PIXEL_TOLERANCE)
    }

    private fun topOf(text: String): Dp =
        composeRule.onAllNodesWithText(text).onFirst().getUnclippedBoundsInRoot().top

    private companion object {
        const val PIXEL_TOLERANCE: Float = 0.5f
    }
}
