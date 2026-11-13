package com.emm.mygame.feature.town

import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.unit.DpRect
import com.emm.mygame.core.designsystem.MyGameSizes
import com.emm.mygame.core.designsystem.MyGameTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class TownSignOutScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val intents: MutableList<TownIntent> = mutableListOf()

    @Test
    fun `offers sign-out under the naming form`() {
        show(emptyNaming())

        composeRule.onNodeWithText("Salir").performScrollTo().performClick()

        assertEquals(listOf<TownIntent>(TownIntent.SignOutTapped), intents)
    }

    @Test
    fun `offers sign-out under a failed read`() {
        show(TownUiState.Failed)

        composeRule.onNodeWithText("Salir").performScrollTo().performClick()

        assertEquals(listOf<TownIntent>(TownIntent.SignOutTapped), intents)
    }

    @Test
    fun `offers no sign-out while loading`() {
        show(TownUiState.Loading)

        composeRule.onAllNodesWithText("Salir").assertCountEquals(0)
    }

    @Test
    fun `announces the sign-out as waiting while the session ends`() {
        show(TownUiState.SigningOut)

        composeRule
            .onNodeWithText("Salir")
            .assert(SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, "Esperando"))
    }

    @Test
    fun `sends nothing from the sign-out while the session ends`() {
        show(TownUiState.SigningOut)

        composeRule.onNodeWithText("Salir").performClick()

        assertEquals(emptyList<TownIntent>(), intents)
    }

    @Test
    fun `holds the sign-out at the touch minimum in height`() {
        show(TownUiState.Failed)

        val target: DpRect = composeRule.onNodeWithText("Salir").getUnclippedBoundsInRoot()

        assertTrue(target.bottom - target.top >= MyGameSizes.control)
    }

    @Test
    fun `holds the sign-out at the touch minimum in width`() {
        show(TownUiState.Failed)

        val target: DpRect = composeRule.onNodeWithText("Salir").getUnclippedBoundsInRoot()

        assertTrue(target.right - target.left >= MyGameSizes.control)
    }

    private fun show(state: TownUiState) {
        composeRule.setContent {
            MyGameTheme {
                TownScreen(
                    state = state,
                    onIntent = { intent: TownIntent -> intents += intent },
                    onSchoolOpen = { },
                    onReportOpen = { },
                    onMapOpen = { },
                    onReviewsOpen = { },
                    onLessonOpen = { },
                )
            }
        }
    }
}
