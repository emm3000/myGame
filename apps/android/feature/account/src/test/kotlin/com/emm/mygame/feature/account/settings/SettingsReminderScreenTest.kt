package com.emm.mygame.feature.account.settings

import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.assertIsOff
import androidx.compose.ui.test.assertIsOn
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isToggleable
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.model.account.PlayerScaffold
import java.time.LocalTime
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

private const val SWITCH_TITLE: String = "Recordatorio de estudio"
private const val SWITCH_LINE: String =
    "Como mucho una vez al día, cerca de la hora que elijas, cuando pueda haber algo que estudiar."
private const val OPEN_SETTINGS: String = "Abrir los ajustes de notificaciones"
private const val REMINDER_OFFER: String = "Activa un recordatorio de estudio"
private const val DENIED_LINE: String =
    "Las notificaciones de Townword están desactivadas en los ajustes del teléfono."

@RunWith(RobolectricTestRunner::class)
class SettingsReminderScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val sentIntents: MutableList<SettingsIntent> = mutableListOf()

    private var notificationSettingsOpens: Int = 0

    private val onAtSevenPm: SettingsUiState.Reminder = firstReminder.copy(isOn = true)

    private fun draw(reminder: SettingsUiState.Reminder) {
        composeRule.setContent {
            MyGameTheme {
                SettingsScreen(
                    state = SettingsUiState.Loaded(PlayerScaffold.Spanish, SettingsUiState.Change.Untouched, reminder),
                    onIntent = { sentIntents += it },
                    onNotificationSettingsOpen = { notificationSettingsOpens += 1 },
                )
            }
        }
    }

    private fun reminderSwitch(title: String = SWITCH_TITLE): SemanticsNodeInteraction =
        composeRule.onNode(isToggleable() and hasText(title, substring = true))

    @Test
    fun `draws the switch off with its line`() {
        draw(firstReminder)

        reminderSwitch().performScrollTo().assertIsOff()
        composeRule
            .onNodeWithText(SWITCH_LINE)
            .assertIsDisplayed()
    }

    @Test
    fun `hides the time while the reminder is off`() {
        draw(firstReminder)

        composeRule.onAllNodesWithText("Hora del recordatorio").assertCountEquals(0)
    }

    @Test
    fun `sends the switch turning on`() {
        draw(firstReminder)

        reminderSwitch().performScrollTo().performClick()

        assertEquals(listOf<SettingsIntent>(SettingsIntent.ReminderSwitched(isOn = true)), sentIntents)
    }

    @Test
    fun `holds the switch while the permission is asked`() {
        draw(firstReminder.copy(ask = SettingsUiState.NotificationAsk.Asking))

        reminderSwitch().performScrollTo().assertIsOff().assertIsNotEnabled()
    }

    @Test
    fun `a denial draws the denied line under the switch`() {
        draw(firstReminder.copy(ask = SettingsUiState.NotificationAsk.Denied))

        reminderSwitch().performScrollTo().assertIsOff()
        composeRule.onNodeWithText(DENIED_LINE).assertIsDisplayed()
    }

    @Test
    fun `the denied line opens the phone's notification settings`() {
        draw(firstReminder.copy(ask = SettingsUiState.NotificationAsk.Denied))

        composeRule.onNodeWithText(OPEN_SETTINGS).performScrollTo().performClick()

        assertEquals(1, notificationSettingsOpens)
    }

    @Test
    fun `draws no settings link before any denial`() {
        draw(firstReminder)

        composeRule.onAllNodesWithText(OPEN_SETTINGS).assertCountEquals(0)
    }

    @Test
    fun `draws no denied line before any denial`() {
        draw(firstReminder)

        composeRule.onAllNodesWithText(DENIED_LINE).assertCountEquals(0)
    }

    @Test
    fun `draws the time while the reminder is on`() {
        draw(onAtSevenPm)

        reminderSwitch().performScrollTo().assertIsOn()
        composeRule.onNodeWithText("Hora del recordatorio").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `draws the time on the 24-hour clock in Spanish`() {
        draw(onAtSevenPm)

        composeRule.onNodeWithText("19:00").performScrollTo().assertIsDisplayed()
    }

    @Test
    @Config(qualifiers = "en-rUS")
    fun `the time starts at 7 00 PM`() {
        draw(onAtSevenPm)

        composeRule.onNodeWithText("7:00 PM").performScrollTo().assertIsDisplayed()
    }

    @Test
    @Config(qualifiers = "en-rUS")
    fun `draws a time after midnight on the 12-hour clock in American English`() {
        draw(onAtSevenPm.copy(time = LocalTime.of(0, 5)))

        composeRule.onNodeWithText("12:05 AM").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `sends each step the player taps`() {
        draw(onAtSevenPm)

        listOf("Una hora antes", "Una hora después", "Cinco minutos antes", "Cinco minutos después")
            .forEach { name: String -> composeRule.onNodeWithContentDescription(name).performScrollTo().performClick() }

        assertEquals(
            ReminderStep.entries.map(SettingsIntent::ReminderStepped),
            sentIntents,
        )
    }

    @Test
    fun `draws the reminder's offer at the top of Me while it is offered`() {
        draw(firstReminder.copy(isOffered = true))

        composeRule.onNodeWithText(REMINDER_OFFER).assertIsDisplayed()
    }

    @Test
    fun `turns the reminder on from its offer`() {
        draw(firstReminder.copy(isOffered = true))

        composeRule.onNodeWithText(REMINDER_OFFER).performClick()

        assertEquals(listOf<SettingsIntent>(SettingsIntent.ReminderSwitched(isOn = true)), sentIntents)
    }

    @Test
    fun `draws no offer while the reminder is not offered`() {
        draw(firstReminder)

        composeRule.onAllNodesWithText(REMINDER_OFFER).assertCountEquals(0)
    }
}
