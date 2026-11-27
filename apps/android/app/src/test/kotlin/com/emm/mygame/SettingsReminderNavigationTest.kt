package com.emm.mygame

import android.Manifest
import android.app.AlarmManager
import android.app.Application
import android.app.NotificationManager
import android.content.Context
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isToggleable
import androidx.compose.ui.test.junit4.AndroidComposeTestRule
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.lifecycle.Lifecycle
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.test.ext.junit.rules.ActivityScenarioRule
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.model.account.PlayerChromePhase
import com.emm.mygame.core.model.account.PlayerLanguage
import com.emm.mygame.core.model.account.PlayerScaffold
import com.emm.mygame.core.model.account.RestoreResult
import com.emm.mygame.core.model.account.SignedInPlayer
import com.emm.mygame.core.model.reminder.StudyReminderChoice
import com.emm.mygame.core.projection.StudyReminderFacts
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.navigation.AppNavigation
import com.emm.mygame.reminder.PhoneReminderNotifications
import com.emm.mygame.reminder.StudyReminderAlarm
import com.emm.mygame.reminder.StudyReminderStore
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.emptyFlow
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.Shadows.shadowOf
import org.robolectric.shadows.ShadowAlarmManager
import org.robolectric.shadows.ShadowNotificationManager
import java.time.LocalTime
import java.time.ZoneOffset
import kotlin.time.Instant

@RunWith(RobolectricTestRunner::class)
class SettingsReminderNavigationTest {

    @get:Rule
    val composeRule: AndroidComposeTestRule<ActivityScenarioRule<ComponentActivity>, ComponentActivity> =
        createAndroidComposeRule<ComponentActivity>()

    private val application: Application = RuntimeEnvironment.getApplication()

    private val sessions: FakeSessionRepository = FakeSessionRepository()

    private val spanishScaffold: PlayerLanguage = PlayerLanguage(PlayerScaffold.Spanish, PlayerChromePhase.Scaffold)

    private val atSevenPm: Instant = Instant.parse("2026-11-17T19:00:30Z")

    private val alarm: StudyReminderAlarm =
        StudyReminderAlarm(application, clockAt(atSevenPm), zone = { ZoneOffset.UTC })

    private val store: StudyReminderStore = StudyReminderStore(
        preferences = application.getSharedPreferences("study-reminder-settings-test", Context.MODE_PRIVATE),
        onChange = alarm::schedule,
    )

    private val lessonReady: StudyReminderFacts = StudyReminderFacts(isLessonReady = true)

    private val onAtSevenPm: StudyReminderChoice = StudyReminderChoice(isOn = true, time = LocalTime.of(19, 0))

    private val alarms: ShadowAlarmManager = shadowOf(application.getSystemService(AlarmManager::class.java))

    private val notifications: ShadowNotificationManager =
        shadowOf(application.getSystemService(NotificationManager::class.java))

    private val dependencies: AppDependencies = dependenciesOf(
        playerLanguage = MutableStateFlow(spanishScaffold),
        playerScaffold = MutableStateFlow(PlayerScaffold.Spanish),
        sessions = sessions,
        studyReminders = store,
        reminderNotifications = PhoneReminderNotifications(application),
    )

    private fun showSettings() {
        repeat(SESSION_READS) {
            sessions.answerRestore(
                RestoreResult.SignedIn(SignedInPlayer("ines@example.com", true, PlayerScaffold.Spanish)),
            )
        }
        composeRule.setContent {
            MyGameTheme {
                AppNavigation(
                    dependencies = dependencies,
                    reminderTaps = emptyFlow(),
                    mailedLinks = emptyFlow(),
                    backStack = rememberNavBackStack(
                        Destination.Today,
                        Destination.Settings,
                    ),
                )
            }
        }
        composeRule.waitUntil(WAIT_MILLIS) {
            composeRule.onAllNodes(isToggleable() and hasText(SWITCH_TITLE, substring = true))
                .fetchSemanticsNodes()
                .isNotEmpty()
        }
    }

    private fun reminderSwitch(): SemanticsNodeInteraction =
        composeRule.onNode(isToggleable() and hasText(SWITCH_TITLE, substring = true))

    private fun turnOffAPostedReminder() {
        store.fold { lessonReady }
        store.choose(onAtSevenPm)
        alarm.fire(onAtSevenPm, lessonReady, spanishScaffold)
        showSettings()

        reminderSwitch().performScrollTo().performClick()
        composeRule.waitForIdle()
    }

    @Test
    fun `turning off cancels the reminder`() {
        turnOffAPostedReminder()

        assertEquals(0, alarms.scheduledAlarms.size)
    }

    @Test
    fun `turning off removes a posted reminder`() {
        turnOffAPostedReminder()

        assertEquals(0, notifications.allNotifications.size)
    }

    @Test
    fun `turning the switch on asks for the notification permission`() {
        notifications.setNotificationsEnabled(false)
        showSettings()

        reminderSwitch().performScrollTo().performClick()
        composeRule.waitForIdle()

        val asked: String? =
            shadowOf(composeRule.activity).lastRequestedPermission?.requestedPermissions?.singleOrNull()
        assertEquals(Manifest.permission.POST_NOTIFICATIONS, asked)
    }

    @Test
    fun `coming back after notifications were turned off draws the denied line`() {
        store.choose(onAtSevenPm)
        showSettings()
        notifications.setNotificationsEnabled(false)

        composeRule.activityRule.scenario.moveToState(Lifecycle.State.STARTED)
        composeRule.activityRule.scenario.moveToState(Lifecycle.State.RESUMED)
        composeRule.waitForIdle()

        composeRule.onNodeWithText(DENIED_LINE).performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `the denied line opens the phone's notification settings`() {
        notifications.setNotificationsEnabled(false)
        store.choose(onAtSevenPm)
        showSettings()

        composeRule.onNodeWithText(OPEN_SETTINGS).performScrollTo().performClick()

        val opened: String? = shadowOf(composeRule.activity).nextStartedActivity?.action
        assertEquals(Settings.ACTION_APP_NOTIFICATION_SETTINGS, opened)
    }

    private companion object {
        const val WAIT_MILLIS: Long = 5_000
        const val SESSION_READS: Int = 3
        const val SWITCH_TITLE: String = "Recordatorio de estudio"
        const val OPEN_SETTINGS: String = "Abrir los ajustes de notificaciones"
        const val DENIED_LINE: String = "Las notificaciones de Townword están desactivadas en los ajustes del teléfono."
    }
}
