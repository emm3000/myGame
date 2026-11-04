package com.emm.mygame.feature.fief

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import com.emm.mygame.core.designsystem.MyGameTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class FirstFiefScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    @Test
    fun `offers sign out while the fiefs are listed`() {
        draw(FirstFiefUiState.Loading)

        composeRule.onNodeWithText("Salir").assertIsDisplayed()
    }

    @Test
    fun `offers sign out beside the no-fief line`() {
        draw(FirstFiefUiState.NoFief)

        composeRule.onNodeWithText("Salir").assertIsDisplayed()
    }

    @Test
    fun `offers sign out beside the outage line`() {
        draw(FirstFiefUiState.Unreachable)

        composeRule.onNodeWithText("Salir").assertIsDisplayed()
    }

    @Test
    fun `keeps the retry on the outage line`() {
        draw(FirstFiefUiState.Unreachable)

        composeRule.onNodeWithText("Volver a intentarlo").assertIsDisplayed()
    }

    @Test
    fun `sends sign out when the lord taps it`() {
        val intents: MutableList<FirstFiefIntent> = mutableListOf()
        draw(FirstFiefUiState.Unreachable, onIntent = { intent: FirstFiefIntent -> intents += intent })

        composeRule.onNodeWithText("Salir").performClick()

        assertEquals(listOf<FirstFiefIntent>(FirstFiefIntent.SignOutTapped), intents)
    }

    private fun draw(state: FirstFiefUiState, onIntent: (FirstFiefIntent) -> Unit = {}) {
        composeRule.setContent {
            MyGameTheme {
                FirstFiefScreen(state = state, onIntent = onIntent)
            }
        }
    }
}
