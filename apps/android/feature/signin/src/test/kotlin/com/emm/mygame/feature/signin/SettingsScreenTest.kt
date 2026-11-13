package com.emm.mygame.feature.signin

import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.assertIsNotSelected
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isSelectable
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.PlayerScaffold
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

private const val SPANISH_CHOICE: String = "Español: una traducción junto a cada palabra nueva"
private const val NONE_CHOICE: String = "Ninguno: todo en inglés, con definiciones en inglés"
private const val OUTAGE_LINE: String = "No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento."

@RunWith(RobolectricTestRunner::class)
class SettingsScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val sentIntents: MutableList<SettingsIntent> = mutableListOf()

    private var townOpens: Int = 0

    private fun draw(state: SettingsUiState) {
        composeRule.setContent {
            MyGameTheme {
                SettingsScreen(state = state, onIntent = { sentIntents += it }, onTownOpen = { townOpens += 1 })
            }
        }
    }

    private fun choice(label: String): SemanticsNodeInteraction = composeRule.onNode(isSelectable() and hasText(label))

    @Test
    fun `draws the stored scaffold as chosen`() {
        draw(SettingsUiState.Loaded(PlayerScaffold.None, SettingsUiState.Change.Untouched))

        choice(NONE_CHOICE).assertIsSelected()
        choice(SPANISH_CHOICE).assertIsNotSelected()
    }

    @Test
    fun `promises the words and progress stay`() {
        draw(SettingsUiState.Loaded(PlayerScaffold.Spanish, SettingsUiState.Change.Untouched))

        composeRule.onNodeWithText("Tus palabras y tu progreso no cambian.").assertIsDisplayed()
    }

    @Test
    fun `sends the scaffold the player taps`() {
        draw(SettingsUiState.Loaded(PlayerScaffold.Spanish, SettingsUiState.Change.Untouched))

        choice(NONE_CHOICE).performClick()

        assertEquals(listOf<SettingsIntent>(SettingsIntent.ScaffoldPicked(PlayerScaffold.None)), sentIntents)
    }

    @Test
    fun `holds every choice while the change is saving`() {
        draw(SettingsUiState.Loaded(PlayerScaffold.Spanish, SettingsUiState.Change.Saving(PlayerScaffold.None)))

        choice(NONE_CHOICE).assertIsSelected().assertIsNotEnabled()
        choice(SPANISH_CHOICE).assertIsNotEnabled()
        composeRule.onNodeWithText("Guardando…").assertIsDisplayed()
    }

    @Test
    fun `draws the saved line once the api answers`() {
        draw(SettingsUiState.Loaded(PlayerScaffold.None, SettingsUiState.Change.Saved))

        composeRule.onNodeWithText("Guardado.").assertIsDisplayed()
    }

    @Test
    fun `draws the outage line beside the stored scaffold on a refusal`() {
        draw(SettingsUiState.Loaded(PlayerScaffold.Spanish, SettingsUiState.Change.Refused))

        composeRule.onNodeWithText(OUTAGE_LINE).assertIsDisplayed()
        choice(SPANISH_CHOICE).assertIsSelected()
    }

    @Test
    fun `draws the outage line when the api cannot be reached`() {
        draw(SettingsUiState.Loaded(PlayerScaffold.Spanish, SettingsUiState.Change.Unreachable))

        composeRule.onNodeWithText(OUTAGE_LINE).assertIsDisplayed()
    }

    @Test
    fun `draws no outcome line before a change`() {
        draw(SettingsUiState.Loaded(PlayerScaffold.Spanish, SettingsUiState.Change.Untouched))

        listOf("Guardando…", "Guardado.", OUTAGE_LINE).forEach { line: String ->
            composeRule.onAllNodesWithText(line).assertCountEquals(0)
        }
    }

    @Test
    fun `offers the retry when the settings cannot be read`() {
        draw(SettingsUiState.Failed)

        composeRule.onNodeWithText("No hemos podido cargar tus ajustes.").assertIsDisplayed()
        composeRule.onNodeWithText("Volver a intentarlo").performClick()

        assertEquals(listOf<SettingsIntent>(SettingsIntent.RetryTapped), sentIntents)
    }

    @Test
    fun `goes back to the town from its link`() {
        draw(SettingsUiState.Failed)

        composeRule.onNodeWithText("Volver a tu pueblo").performClick()

        assertEquals(1, townOpens)
    }

    @Test
    fun `titles the screen while it loads`() {
        draw(SettingsUiState.Loading)

        composeRule.onNodeWithText("Ajustes").assertIsDisplayed()
    }
}
