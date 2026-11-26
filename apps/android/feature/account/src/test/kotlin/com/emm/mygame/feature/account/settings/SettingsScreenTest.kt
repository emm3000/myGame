package com.emm.mygame.feature.account.settings

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.assertIsNotSelected
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasScrollAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isHeading
import androidx.compose.ui.test.isSelectable
import androidx.compose.ui.test.junit4.StateRestorationTester
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.DpRect
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.dp
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.model.account.PlayerScaffold
import com.emm.mygame.core.uitesting.textStyleOf
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

private const val SPANISH_CHOICE: String = "Español: una traducción junto a cada palabra nueva"
private const val NONE_CHOICE: String = "Ninguno: todo en inglés, con definiciones en inglés"
private const val HELP_LANGUAGE_QUESTION: String = "Idioma de ayuda"
private const val REMINDER_TITLE: String = "Recordatorio de estudio"
private const val OUTAGE_LINE: String = "No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento."
private const val RETRY: String = "Volver a intentarlo"
private const val SIGN_OUT: String = "Salir"
private const val OPEN_NOTIFICATION_SETTINGS: String = "Abrir los ajustes de notificaciones"
private val timeSteps: List<String> =
    listOf("Una hora antes", "Una hora después", "Cinco minutos antes", "Cinco minutos después")

@RunWith(RobolectricTestRunner::class)
class SettingsScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val sentIntents: MutableList<SettingsIntent> = mutableListOf()

    private fun draw(state: SettingsUiState) {
        composeRule.setContent {
            MyGameTheme {
                SettingsScreen(
                    state = state,
                    onIntent = { sentIntents += it },
                    onNotificationSettingsOpen = {},
                )
            }
        }
    }

    private val ownControl: SemanticsMatcher =
        (
            listOf(SPANISH_CHOICE, NONE_CHOICE, REMINDER_TITLE, OPEN_NOTIFICATION_SETTINGS, RETRY, SIGN_OUT)
                .map(::hasText) +
                timeSteps.map(::hasContentDescription)
            ).reduce(SemanticsMatcher::or)

    private fun assertOnlyOwnControls(count: Int) {
        composeRule.onAllNodes(hasClickAction() and !ownControl).assertCountEquals(0)
        composeRule.onAllNodes(hasClickAction() and ownControl).assertCountEquals(count)
    }

    private fun choice(label: String): SemanticsNodeInteraction = composeRule.onNode(isSelectable() and hasText(label))

    @Test
    fun `draws the stored scaffold as chosen`() {
        draw(SettingsUiState.Loaded(PlayerScaffold.None, SettingsUiState.Change.Untouched, firstReminder))

        choice(NONE_CHOICE).assertIsSelected()
        choice(SPANISH_CHOICE).assertIsNotSelected()
    }

    @Test
    fun `draws the help language question as a section title in heading on the ink`() {
        var ink: Color = Color.Unspecified
        composeRule.setContent {
            MyGameTheme {
                ink = MyGameTheme.colors.ink
                SettingsScreen(state = untouched, onIntent = {}, onNotificationSettingsOpen = {})
            }
        }

        val drawn: TextStyle = textStyleOf(composeRule, HELP_LANGUAGE_QUESTION)
        assertEquals(MyGameTypography.heading.fontSize, drawn.fontSize)
        assertEquals(MyGameTypography.heading.fontWeight, drawn.fontWeight)
        assertEquals(ink, drawn.color)
        composeRule.onNode(isHeading() and hasText(HELP_LANGUAGE_QUESTION)).assertExists()
    }

    @Test
    fun `promises the words and progress stay`() {
        draw(SettingsUiState.Loaded(PlayerScaffold.Spanish, SettingsUiState.Change.Untouched, firstReminder))

        composeRule.onNodeWithText("Tus palabras y tu progreso no cambian.").assertIsDisplayed()
    }

    @Test
    fun `sends the scaffold the player taps`() {
        draw(SettingsUiState.Loaded(PlayerScaffold.Spanish, SettingsUiState.Change.Untouched, firstReminder))

        choice(NONE_CHOICE).performClick()

        assertEquals(listOf<SettingsIntent>(SettingsIntent.ScaffoldPicked(PlayerScaffold.None)), sentIntents)
    }

    @Test
    fun `holds every choice while the change is saving`() {
        draw(
            SettingsUiState.Loaded(
                PlayerScaffold.Spanish,
                SettingsUiState.Change.Saving(PlayerScaffold.None),
                firstReminder,
            ),
        )

        choice(NONE_CHOICE).assertIsSelected().assertIsNotEnabled()
        choice(SPANISH_CHOICE).assertIsNotEnabled()
        composeRule.onNodeWithText("Guardando…").assertIsDisplayed()
    }

    @Test
    fun `draws the saved line once the api answers`() {
        draw(SettingsUiState.Loaded(PlayerScaffold.None, SettingsUiState.Change.Saved, firstReminder))

        composeRule.onNodeWithText("Guardado.").assertIsDisplayed()
    }

    @Test
    fun `brings the saved line fully into view when the change lands below the fold`() {
        val shown: MutableState<SettingsUiState> = mutableStateOf(untouched)
        drawInShortWindow(shown)

        shown.value = untouched.copy(change = SettingsUiState.Change.Saved)
        composeRule.waitForIdle()

        assertFullyInView("Guardado.")
    }

    @Test
    fun `brings the saving line fully into view when the change lands below the fold`() {
        val shown: MutableState<SettingsUiState> = mutableStateOf(untouched)
        drawInShortWindow(shown)

        shown.value = untouched.copy(change = SettingsUiState.Change.Saving(PlayerScaffold.None))
        composeRule.waitForIdle()

        assertFullyInView("Guardando…")
    }

    @Test
    fun `brings the outage alert fully into view when the change lands below the fold`() {
        val shown: MutableState<SettingsUiState> = mutableStateOf(untouched)
        drawInShortWindow(shown)

        shown.value = untouched.copy(change = SettingsUiState.Change.Unreachable)
        composeRule.waitForIdle()

        assertFullyInView(OUTAGE_LINE)
    }

    @Test
    fun `does not scroll to the saved line again when the screen is recreated with the same change`() {
        val restoration: StateRestorationTester = StateRestorationTester(composeRule)
        val shown: MutableState<SettingsUiState> = mutableStateOf(untouched)
        restoration.setContent { ShortWindowScreen(shown.value) }
        shown.value = untouched.copy(change = SettingsUiState.Change.Saved)
        composeRule.waitForIdle()
        composeRule.onNodeWithText("Ajustes").performScrollTo()

        restoration.emulateSavedInstanceStateRestore()

        assertFullyInView("Ajustes")
    }

    @Test
    fun `draws the outage line beside the stored scaffold on a refusal`() {
        draw(SettingsUiState.Loaded(PlayerScaffold.Spanish, SettingsUiState.Change.Refused, firstReminder))

        composeRule.onNodeWithText(OUTAGE_LINE).assertIsDisplayed()
        choice(SPANISH_CHOICE).assertIsSelected()
    }

    @Test
    fun `draws the outage line when the api cannot be reached`() {
        draw(SettingsUiState.Loaded(PlayerScaffold.Spanish, SettingsUiState.Change.Unreachable, firstReminder))

        composeRule.onNodeWithText(OUTAGE_LINE).assertIsDisplayed()
    }

    @Test
    fun `draws no outcome line before a change`() {
        draw(SettingsUiState.Loaded(PlayerScaffold.Spanish, SettingsUiState.Change.Untouched, firstReminder))

        listOf("Guardando…", "Guardado.", OUTAGE_LINE).forEach { line: String ->
            composeRule.onAllNodesWithText(line).assertCountEquals(0)
        }
    }

    @Test
    fun `offers the retry when the settings cannot be read`() {
        draw(SettingsUiState.Failed)

        composeRule.onNodeWithText("No hemos podido cargar tus ajustes.").assertIsDisplayed()
        composeRule.onNodeWithText(RETRY).performClick()

        assertEquals(listOf<SettingsIntent>(SettingsIntent.RetryTapped), sentIntents)
    }

    @Test
    fun `draws no link back to the town`() {
        draw(SettingsUiState.Loaded(PlayerScaffold.Spanish, SettingsUiState.Change.Untouched, firstReminder))

        composeRule.onAllNodesWithText("Volver a tu pueblo").assertCountEquals(0)
        assertOnlyOwnControls(count = 4)
    }

    @Test
    fun `draws only the scaffold choices, the switch, the time steps and the sign-out with the reminder on`() {
        draw(untouched.copy(reminder = firstReminder.copy(isOn = true)))

        assertOnlyOwnControls(count = 8)
    }

    @Test
    fun `draws only the scaffold choices, the switch, the settings link and the sign-out with notifications denied`() {
        draw(untouched.copy(reminder = firstReminder.copy(ask = SettingsUiState.NotificationAsk.Denied)))

        assertOnlyOwnControls(count = 5)
    }

    @Test
    fun `draws only the choices, the switch, the settings link, the time steps and the sign-out when denied and on`() {
        draw(
            untouched.copy(
                reminder = firstReminder.copy(isOn = true, ask = SettingsUiState.NotificationAsk.Denied),
            ),
        )

        assertOnlyOwnControls(count = 9)
    }

    @Test
    fun `draws only the retry and the sign-out when the settings cannot be read`() {
        draw(SettingsUiState.Failed)

        assertOnlyOwnControls(count = 2)
    }

    @Test
    fun `titles the screen while it loads`() {
        draw(SettingsUiState.Loading)

        composeRule.onNodeWithText("Ajustes").assertIsDisplayed()
    }

    @Test
    fun `keeps the theme choice in its place when the settings land`() {
        val shown: MutableState<SettingsUiState> = mutableStateOf(SettingsUiState.Loading)
        composeRule.setContent {
            MyGameTheme {
                SettingsScreen(
                    state = shown.value,
                    onIntent = {},
                    onNotificationSettingsOpen = {},
                    themeChoice = {
                        MyGameText(text = THEME_CHOICE, style = MyGameTypography.body, color = MyGameTheme.colors.ink)
                    },
                )
            }
        }
        val whileLoading: Dp = themeChoiceTop()

        shown.value = SettingsUiState.Loaded(PlayerScaffold.Spanish, SettingsUiState.Change.Untouched, firstReminder)

        assertEquals(whileLoading, themeChoiceTop())
    }

    private fun drawInShortWindow(shown: MutableState<SettingsUiState>) {
        composeRule.setContent { ShortWindowScreen(shown.value) }
    }

    @Composable
    private fun ShortWindowScreen(state: SettingsUiState) {
        MyGameTheme {
            Box(modifier = Modifier.size(shortWindow)) {
                SettingsScreen(state = state, onIntent = {}, onNotificationSettingsOpen = {})
            }
        }
    }

    private fun assertFullyInView(text: String) {
        val viewport: DpRect = composeRule.onNode(hasScrollAction()).getUnclippedBoundsInRoot()
        val shownNode: DpRect = composeRule.onNodeWithText(text).getUnclippedBoundsInRoot()
        assertTrue("node starts at ${shownNode.top}, viewport at ${viewport.top}", shownNode.top >= viewport.top)
        assertTrue(
            "node ends at ${shownNode.bottom}, viewport at ${viewport.bottom}",
            shownNode.bottom <= viewport.bottom,
        )
    }

    private fun themeChoiceTop(): Dp = composeRule.onNodeWithText(THEME_CHOICE).getUnclippedBoundsInRoot().top
}

private const val THEME_CHOICE: String = "The theme choice"

private val shortWindow: DpSize = DpSize(360.dp, 240.dp)

private val untouched: SettingsUiState.Loaded =
    SettingsUiState.Loaded(PlayerScaffold.Spanish, SettingsUiState.Change.Untouched, firstReminder)
