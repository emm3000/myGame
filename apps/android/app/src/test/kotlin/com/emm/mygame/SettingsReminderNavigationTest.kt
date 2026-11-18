package com.emm.mygame

import android.Manifest
import android.app.AlarmManager
import android.app.Application
import android.app.NotificationManager
import android.content.Context
import androidx.activity.ComponentActivity
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isToggleable
import androidx.compose.ui.test.junit4.AndroidComposeTestRule
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.test.ext.junit.rules.ActivityScenarioRule
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.HoldoutCheckRepository
import com.emm.mygame.core.network.LearningRepository
import com.emm.mygame.core.network.PlacementRepository
import com.emm.mygame.core.network.PlayerChromePhase
import com.emm.mygame.core.network.PlayerLanguage
import com.emm.mygame.core.network.PlayerScaffold
import com.emm.mygame.core.network.ReportRepository
import com.emm.mygame.core.network.RestoreResult
import com.emm.mygame.core.network.SessionEnds
import com.emm.mygame.core.network.SessionRepository
import com.emm.mygame.core.network.SignedInPlayer
import com.emm.mygame.core.network.StudyReminderChoice
import com.emm.mygame.core.network.StudyReminderSettings
import com.emm.mygame.core.network.TownRepository
import com.emm.mygame.core.projection.StudyReminderFacts
import com.emm.mygame.core.testing.FakeHoldoutCheckRepository
import com.emm.mygame.core.testing.FakeLearningRepository
import com.emm.mygame.core.testing.FakePlacementRepository
import com.emm.mygame.core.testing.FakeReportRepository
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.core.testing.FakeTownRepository
import java.time.LocalTime
import java.time.ZoneOffset
import kotlin.time.Clock
import kotlin.time.Instant
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
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

@RunWith(RobolectricTestRunner::class)
class SettingsReminderNavigationTest {

    @get:Rule
    val composeRule: AndroidComposeTestRule<ActivityScenarioRule<ComponentActivity>, ComponentActivity> =
        createAndroidComposeRule<ComponentActivity>()

    private val application: Application = RuntimeEnvironment.getApplication()

    private val sessionsFake: FakeSessionRepository = FakeSessionRepository()

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

    private val dependencies: AppDependencies = object : AppDependencies {
        override val clock: Clock = Clock.System
        override val sessionEnds: SessionEnds = SessionEnds()
        override val playerLanguage: StateFlow<PlayerLanguage?> = MutableStateFlow(spanishScaffold)
        override val playerScaffold: StateFlow<PlayerScaffold?> = MutableStateFlow(PlayerScaffold.Spanish)
        override val sessions: SessionRepository = sessionsFake
        override val towns: TownRepository = FakeTownRepository()
        override val learning: LearningRepository = FakeLearningRepository()
        override val reports: ReportRepository = FakeReportRepository()
        override val placements: PlacementRepository = FakePlacementRepository()
        override val holdoutChecks: HoldoutCheckRepository = FakeHoldoutCheckRepository()
        override val studyReminders: StudyReminderSettings = store
    }

    private fun showSettings() {
        repeat(SESSION_READS) {
            sessionsFake.answerRestore(
                RestoreResult.SignedIn(SignedInPlayer("ines@example.com", true, PlayerScaffold.Spanish)),
            )
        }
        composeRule.setContent {
            MyGameTheme {
                AppNavigation(
                    dependencies = dependencies,
                    reminderTaps = emptyFlow(),
                    backStack = rememberNavBackStack(Destination.Town, Destination.Report, Destination.Settings),
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

    private companion object {
        const val WAIT_MILLIS: Long = 5_000
        const val SESSION_READS: Int = 3
        const val SWITCH_TITLE: String = "Recordatorio de estudio"
    }
}
