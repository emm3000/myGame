package com.emm.mygame.feature.account

import app.cash.turbine.test
import com.emm.mygame.core.model.account.PlayerScaffold
import com.emm.mygame.core.model.account.RestoreResult
import com.emm.mygame.core.model.account.SignedInPlayer
import com.emm.mygame.core.model.reminder.StudyReminderChoice
import com.emm.mygame.core.testing.FakeReminderNotifications
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.core.testing.FakeStudyReminderSettings
import com.emm.mygame.core.testing.MainDispatcherRule
import java.time.LocalTime
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class SettingsReminderViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val sessions: FakeSessionRepository = FakeSessionRepository()

    private val heldScaffold: MutableStateFlow<PlayerScaffold?> = MutableStateFlow(PlayerScaffold.Spanish)

    private val askableNotifications: FakeReminderNotifications =
        FakeReminderNotifications(areAllowed = false, canAsk = true)

    private val offAtSevenPm: StudyReminderChoice = StudyReminderChoice.firstChoice

    private fun onAt(hour: Int, minute: Int): StudyReminderChoice =
        StudyReminderChoice(isOn = true, time = LocalTime.of(hour, minute))

    private fun loaded(
        reminders: FakeStudyReminderSettings,
        notifications: FakeReminderNotifications = askableNotifications,
    ): SettingsViewModel {
        sessions.answerRestore(RestoreResult.SignedIn(SignedInPlayer("ines@example.com", true, PlayerScaffold.Spanish)))
        return SettingsViewModel(sessions, heldScaffold, reminders, notifications)
    }

    private fun reminderOf(viewModel: SettingsViewModel): SettingsUiState.Reminder =
        (viewModel.state.value as SettingsUiState.Loaded).reminder

    private fun timeAfter(step: ReminderStep, from: StudyReminderChoice): LocalTime {
        val reminders: FakeStudyReminderSettings = FakeStudyReminderSettings(from)
        val viewModel: SettingsViewModel = loaded(reminders)

        viewModel.onIntent(SettingsIntent.ReminderStepped(step))

        return reminders.choice.value.time
    }

    @Test
    fun `asks for the permission only when the switch turns on`() = runTest {
        val viewModel: SettingsViewModel = loaded(FakeStudyReminderSettings(offAtSevenPm))

        viewModel.effects.test {
            expectNoEvents()

            viewModel.onIntent(SettingsIntent.ReminderSwitched(isOn = true))

            assertEquals(SettingsEffect.AskNotifications, awaitItem())
            expectNoEvents()
        }
    }

    @Test
    fun `draws the switch as asking while the permission is asked`() = runTest {
        val reminders: FakeStudyReminderSettings = FakeStudyReminderSettings(offAtSevenPm)
        val viewModel: SettingsViewModel = loaded(reminders)

        viewModel.onIntent(SettingsIntent.ReminderSwitched(isOn = true))

        assertEquals(firstReminder.copy(ask = SettingsUiState.NotificationAsk.Asking), reminderOf(viewModel))
    }

    @Test
    fun `chooses nothing while the permission is asked`() = runTest {
        val reminders: FakeStudyReminderSettings = FakeStudyReminderSettings(offAtSevenPm)
        val viewModel: SettingsViewModel = loaded(reminders)

        viewModel.onIntent(SettingsIntent.ReminderSwitched(isOn = true))

        assertEquals(emptyList<StudyReminderChoice>(), reminders.chosen)
    }

    @Test
    fun `a grant that reaches a rebuilt screen still turns the switch on`() = runTest {
        val reminders: FakeStudyReminderSettings = FakeStudyReminderSettings(offAtSevenPm)
        val rebuilt: SettingsViewModel = loaded(reminders)
        askableNotifications.areAllowed = true

        rebuilt.onIntent(SettingsIntent.NotificationsAnswered(isGranted = true))

        assertEquals(listOf(onAt(19, 0)), reminders.chosen)
    }

    @Test
    fun `a choice turned on elsewhere clears the denied line`() = runTest {
        val reminders: FakeStudyReminderSettings = FakeStudyReminderSettings(offAtSevenPm)
        val viewModel: SettingsViewModel = loaded(reminders)
        viewModel.onIntent(SettingsIntent.ReminderSwitched(isOn = true))
        viewModel.onIntent(SettingsIntent.NotificationsAnswered(isGranted = false))
        askableNotifications.areAllowed = true

        reminders.choose(onAt(19, 0))

        assertEquals(firstReminder.copy(isOn = true), reminderOf(viewModel))
    }

    @Test
    fun `a reminder left on while notifications are off draws the switch off with the denied line`() = runTest {
        val viewModel: SettingsViewModel = loaded(FakeStudyReminderSettings(onAt(19, 0)))

        assertEquals(firstReminder.copy(ask = SettingsUiState.NotificationAsk.Denied), reminderOf(viewModel))
    }

    @Test
    fun `holds a reminder left on while the permission is asked`() = runTest {
        val viewModel: SettingsViewModel = loaded(FakeStudyReminderSettings(onAt(19, 0)))

        viewModel.onIntent(SettingsIntent.ReminderSwitched(isOn = true))

        assertEquals(firstReminder.copy(ask = SettingsUiState.NotificationAsk.Asking), reminderOf(viewModel))
    }

    @Test
    fun `coming back after notifications were turned off draws the denied line`() = runTest {
        val allowedNow: FakeReminderNotifications = FakeReminderNotifications(areAllowed = true, canAsk = true)
        val viewModel: SettingsViewModel = loaded(FakeStudyReminderSettings(onAt(19, 0)), allowedNow)
        allowedNow.areAllowed = false

        viewModel.onIntent(SettingsIntent.ScreenResumed)

        assertEquals(firstReminder.copy(ask = SettingsUiState.NotificationAsk.Denied), reminderOf(viewModel))
    }

    @Test
    fun `coming back after notifications were allowed again clears the denied line`() = runTest {
        val viewModel: SettingsViewModel = loaded(FakeStudyReminderSettings(offAtSevenPm))
        viewModel.onIntent(SettingsIntent.ReminderSwitched(isOn = true))
        viewModel.onIntent(SettingsIntent.NotificationsAnswered(isGranted = false))
        askableNotifications.areAllowed = true

        viewModel.onIntent(SettingsIntent.ScreenResumed)

        assertEquals(firstReminder, reminderOf(viewModel))
    }

    @Test
    fun `coming back after notifications were allowed again draws a reminder left on as on`() = runTest {
        val viewModel: SettingsViewModel = loaded(FakeStudyReminderSettings(onAt(19, 0)))
        askableNotifications.areAllowed = true

        viewModel.onIntent(SettingsIntent.ScreenResumed)

        assertEquals(firstReminder.copy(isOn = true), reminderOf(viewModel))
    }

    @Test
    fun `coming back while the permission is asked keeps the switch held`() = runTest {
        val viewModel: SettingsViewModel = loaded(FakeStudyReminderSettings(offAtSevenPm))
        viewModel.onIntent(SettingsIntent.ReminderSwitched(isOn = true))

        viewModel.onIntent(SettingsIntent.ScreenResumed)

        assertEquals(firstReminder.copy(ask = SettingsUiState.NotificationAsk.Asking), reminderOf(viewModel))
    }

    @Test
    fun `a grant turns the switch on`() = runTest {
        val reminders: FakeStudyReminderSettings = FakeStudyReminderSettings(offAtSevenPm)
        val viewModel: SettingsViewModel = loaded(reminders)
        viewModel.onIntent(SettingsIntent.ReminderSwitched(isOn = true))
        askableNotifications.areAllowed = true

        viewModel.onIntent(SettingsIntent.NotificationsAnswered(isGranted = true))

        assertEquals(listOf(onAt(19, 0)), reminders.chosen)
    }

    @Test
    fun `a denial leaves the switch off with the denied line`() = runTest {
        val reminders: FakeStudyReminderSettings = FakeStudyReminderSettings(offAtSevenPm)
        val viewModel: SettingsViewModel = loaded(reminders)
        viewModel.onIntent(SettingsIntent.ReminderSwitched(isOn = true))

        viewModel.onIntent(SettingsIntent.NotificationsAnswered(isGranted = false))

        assertEquals(firstReminder.copy(ask = SettingsUiState.NotificationAsk.Denied), reminderOf(viewModel))
        assertEquals(emptyList<StudyReminderChoice>(), reminders.chosen)
    }

    @Test
    fun `never asks while the phone cannot ask`() = runTest {
        val viewModel: SettingsViewModel =
            loaded(
                FakeStudyReminderSettings(offAtSevenPm),
                FakeReminderNotifications(areAllowed = false, canAsk = false),
            )

        viewModel.effects.test {
            viewModel.onIntent(SettingsIntent.ReminderSwitched(isOn = true))

            expectNoEvents()
        }
    }

    @Test
    fun `notifications off for the app leave the switch off with the denied line`() = runTest {
        val reminders: FakeStudyReminderSettings = FakeStudyReminderSettings(offAtSevenPm)
        val viewModel: SettingsViewModel =
            loaded(reminders, FakeReminderNotifications(areAllowed = false, canAsk = false))

        viewModel.onIntent(SettingsIntent.ReminderSwitched(isOn = true))

        assertEquals(firstReminder.copy(ask = SettingsUiState.NotificationAsk.Denied), reminderOf(viewModel))
        assertEquals(emptyList<StudyReminderChoice>(), reminders.chosen)
    }

    @Test
    fun `never asks while notifications are allowed`() = runTest {
        val viewModel: SettingsViewModel =
            loaded(
                FakeStudyReminderSettings(offAtSevenPm),
                FakeReminderNotifications(areAllowed = true, canAsk = true),
            )

        viewModel.effects.test {
            viewModel.onIntent(SettingsIntent.ReminderSwitched(isOn = true))

            expectNoEvents()
        }
    }

    @Test
    fun `turns on at once while notifications are allowed`() = runTest {
        val reminders: FakeStudyReminderSettings = FakeStudyReminderSettings(offAtSevenPm)
        val viewModel: SettingsViewModel =
            loaded(reminders, FakeReminderNotifications(areAllowed = true, canAsk = true))

        viewModel.onIntent(SettingsIntent.ReminderSwitched(isOn = true))

        assertEquals(listOf(onAt(19, 0)), reminders.chosen)
    }

    @Test
    fun `turning off clears the denied line`() = runTest {
        val reminders: FakeStudyReminderSettings = FakeStudyReminderSettings(offAtSevenPm)
        val viewModel: SettingsViewModel = loaded(reminders)
        viewModel.onIntent(SettingsIntent.ReminderSwitched(isOn = true))
        viewModel.onIntent(SettingsIntent.NotificationsAnswered(isGranted = false))

        viewModel.onIntent(SettingsIntent.ReminderSwitched(isOn = false))

        assertEquals(firstReminder, reminderOf(viewModel))
    }

    @Test
    fun `turning off chooses off at the same time`() = runTest {
        val reminders: FakeStudyReminderSettings = FakeStudyReminderSettings(onAt(21, 30))
        val viewModel: SettingsViewModel = loaded(reminders)

        viewModel.onIntent(SettingsIntent.ReminderSwitched(isOn = false))

        assertEquals(listOf(StudyReminderChoice(isOn = false, time = LocalTime.of(21, 30))), reminders.chosen)
    }

    @Test
    fun `follows a choice the store changes`() = runTest {
        val reminders: FakeStudyReminderSettings = FakeStudyReminderSettings(onAt(21, 30))
        val viewModel: SettingsViewModel = loaded(reminders)

        reminders.choose(offAtSevenPm)

        assertEquals(firstReminder, reminderOf(viewModel))
    }

    @Test
    fun `a step past midnight wraps`() = runTest {
        assertEquals(LocalTime.of(0, 0), timeAfter(ReminderStep.MinutesLater, onAt(23, 55)))
    }

    @Test
    fun `a step back past midnight wraps`() = runTest {
        assertEquals(LocalTime.of(23, 55), timeAfter(ReminderStep.MinutesEarlier, onAt(0, 0)))
    }

    @Test
    fun `an hour past 11 PM wraps to the same minute after midnight`() = runTest {
        assertEquals(LocalTime.of(0, 40), timeAfter(ReminderStep.HourLater, onAt(23, 40)))
    }

    @Test
    fun `an hour back before 1 AM wraps to the same minute before midnight`() = runTest {
        assertEquals(LocalTime.of(23, 40), timeAfter(ReminderStep.HourEarlier, onAt(0, 40)))
    }

    @Test
    fun `a later minute step from a stored minute off the five grid snaps to the next five`() = runTest {
        assertEquals(LocalTime.of(19, 10), timeAfter(ReminderStep.MinutesLater, onAt(19, 7)))
    }

    @Test
    fun `an earlier minute step from a stored minute off the five grid snaps to the last five`() = runTest {
        assertEquals(LocalTime.of(19, 5), timeAfter(ReminderStep.MinutesEarlier, onAt(19, 7)))
    }

    @Test
    fun `an hour step keeps a stored minute off the five grid`() = runTest {
        assertEquals(LocalTime.of(20, 7), timeAfter(ReminderStep.HourLater, onAt(19, 7)))
    }

    @Test
    fun `a step keeps the switch on`() = runTest {
        val reminders: FakeStudyReminderSettings = FakeStudyReminderSettings(onAt(19, 0))
        val viewModel: SettingsViewModel = loaded(reminders)

        viewModel.onIntent(SettingsIntent.ReminderStepped(ReminderStep.HourLater))

        assertEquals(listOf(onAt(20, 0)), reminders.chosen)
    }
}
