package com.emm.mygame.feature.signin

import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assertHeightIsAtLeast
import androidx.compose.ui.test.assertIsNotSelected
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isSelectable
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.unit.dp
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.ThemePick
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

private const val SYSTEM_CHOICE: String = "Sistema"
private const val LIGHT_CHOICE: String = "Claro"
private const val DARK_CHOICE: String = "Oscuro"

@RunWith(RobolectricTestRunner::class)
class ThemeChoiceScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val sentIntents: MutableList<ThemeChoiceIntent> = mutableListOf()

    private val radioButton: SemanticsMatcher = SemanticsMatcher.expectValue(SemanticsProperties.Role, Role.RadioButton)

    private fun draw(theme: ThemePick) {
        composeRule.setContent {
            MyGameTheme {
                ThemeChoiceScreen(state = ThemeChoiceUiState(theme), onIntent = { sentIntents += it })
            }
        }
    }

    private fun choice(label: String): SemanticsNodeInteraction = composeRule.onNode(isSelectable() and hasText(label))

    @Test
    fun `draws the stored theme as chosen`() {
        draw(ThemePick.Dark)

        choice(DARK_CHOICE).assertIsSelected()
        choice(LIGHT_CHOICE).assertIsNotSelected()
        choice(SYSTEM_CHOICE).assertIsNotSelected()
    }

    @Test
    fun `sends the theme the player taps`() {
        draw(ThemePick.System)

        choice(LIGHT_CHOICE).performClick()

        assertEquals(listOf<ThemeChoiceIntent>(ThemeChoiceIntent.Picked(ThemePick.Light)), sentIntents)
    }

    @Test
    fun `offers every theme as a radio button at least 48 dp tall`() {
        draw(ThemePick.System)

        listOf(SYSTEM_CHOICE, LIGHT_CHOICE, DARK_CHOICE).forEach { label: String ->
            composeRule.onNode(radioButton and hasText(label)).assertHeightIsAtLeast(48.dp)
        }
    }

    @Test
    fun `names the theme group for TalkBack`() {
        draw(ThemePick.System)

        composeRule.onNode(hasContentDescription("Tema")).assertExists()
    }

    @Test
    fun `draws the theme choice while the settings load`() {
        composeRule.setContent {
            MyGameTheme {
                SettingsScreen(
                    state = SettingsUiState.Loading,
                    onIntent = {},
                    onTownOpen = {},
                    onNotificationSettingsOpen = {},
                    themeChoice = {
                        ThemeChoiceScreen(state = ThemeChoiceUiState(ThemePick.System), onIntent = {})
                    },
                )
            }
        }

        composeRule.onNodeWithText(DARK_CHOICE).performScrollTo().assertExists()
    }
}
