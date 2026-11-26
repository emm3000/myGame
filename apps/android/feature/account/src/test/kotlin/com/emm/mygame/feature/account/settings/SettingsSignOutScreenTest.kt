package com.emm.mygame.feature.account.settings

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.unit.Dp
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.model.account.PlayerScaffold
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

private const val SIGN_OUT: String = "Salir"
private const val REMINDER_TITLE: String = "Recordatorio de estudio"

@RunWith(RobolectricTestRunner::class)
class SettingsSignOutScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val sentIntents: MutableList<SettingsIntent> = mutableListOf()

    private val loaded: SettingsUiState =
        SettingsUiState.Loaded(PlayerScaffold.Spanish, SettingsUiState.Change.Untouched, firstReminder)

    private fun draw(state: SettingsUiState) {
        composeRule.setContent {
            MyGameTheme {
                SettingsScreen(state = state, onIntent = { sentIntents += it }, onNotificationSettingsOpen = {})
            }
        }
    }

    private fun unclippedTopOf(text: String): Dp =
        composeRule.onNodeWithText(text, substring = true).getUnclippedBoundsInRoot().top

    @Test
    fun `sends the sign-out from Me`() {
        draw(loaded)

        composeRule.onNode(hasText(SIGN_OUT) and hasClickAction()).performScrollTo().performClick()

        assertEquals(listOf<SettingsIntent>(SettingsIntent.SignOutTapped), sentIntents)
    }

    @Test
    fun `keeps the sign-out at the foot of Me, under the reminder`() {
        draw(loaded)

        assertTrue(unclippedTopOf(REMINDER_TITLE) < unclippedTopOf(SIGN_OUT))
    }

    @Test
    fun `keeps the sign-out on settings that failed to read`() {
        draw(SettingsUiState.Failed)

        composeRule.onNode(hasText(SIGN_OUT) and hasClickAction()).performScrollTo().performClick()

        assertEquals(listOf<SettingsIntent>(SettingsIntent.SignOutTapped), sentIntents)
    }

    @Test
    fun `keeps the sign-out while Me loads`() {
        draw(SettingsUiState.Loading)

        composeRule.onNode(hasText(SIGN_OUT) and hasClickAction()).performScrollTo().performClick()

        assertEquals(listOf<SettingsIntent>(SettingsIntent.SignOutTapped), sentIntents)
    }

    @Test
    fun `holds the sign-out while it is under way`() {
        draw(SettingsUiState.SigningOut)

        composeRule.onNodeWithText(SIGN_OUT, useUnmergedTree = true).assertIsDisplayed()
        composeRule.onNode(hasText(SIGN_OUT) and hasClickAction()).assertIsNotEnabled()
    }
}
