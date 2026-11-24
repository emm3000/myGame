package com.emm.mygame

import android.app.AlarmManager
import android.app.Notification
import android.app.NotificationManager
import android.content.Intent
import com.emm.mygame.core.model.account.PlayerChromePhase
import com.emm.mygame.core.model.account.PlayerLanguage
import com.emm.mygame.core.model.account.PlayerScaffold
import com.emm.mygame.core.model.reminder.StudyReminderChoice
import com.emm.mygame.core.projection.StudyReminderFacts
import java.time.LocalTime
import java.util.TimeZone
import kotlin.time.Instant
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.Shadows.shadowOf
import org.robolectric.shadows.ShadowAlarmManager

@RunWith(RobolectricTestRunner::class)
class StudyReminderReceiverTest {

    private val application: MyGameApplication = RuntimeEnvironment.getApplication() as MyGameApplication

    private val phoneZone: TimeZone = TimeZone.getDefault()

    private val onAtSevenPm: StudyReminderChoice = StudyReminderChoice(isOn = true, time = LocalTime.of(19, 0))

    private val wordsWaitingIn2100: StudyReminderFacts =
        StudyReminderFacts(cardsWaitingFrom = Instant.parse("2100-01-01T00:00:00Z"))

    private val alarmManager: AlarmManager = application.getSystemService(AlarmManager::class.java)

    private val alarms: ShadowAlarmManager = shadowOf(alarmManager)

    @Before
    fun startInUtc() {
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"))
    }

    @After
    fun restorePhoneZone() {
        TimeZone.setDefault(phoneZone)
    }

    @Test
    fun `boot, a time set and a time zone change reschedule from the stored facts`() {
        application.studyReminderStore.choose(onAtSevenPm)
        application.studyReminderStore.fold { wordsWaitingIn2100 }
        val clockChanges: List<String> =
            listOf(Intent.ACTION_BOOT_COMPLETED, Intent.ACTION_TIME_CHANGED, Intent.ACTION_TIMEZONE_CHANGED)

        val rescheduled: List<List<SeenAlarm>> = clockChanges.map { action: String ->
            alarms.scheduledAlarms.mapNotNull { scheduled -> scheduled.operation }.forEach(alarmManager::cancel)
            StudyReminderReceiver().onReceive(application, Intent(action))
            alarms.scheduledAlarms.map(::seenAlarmOf)
        }

        assertEquals(List(clockChanges.size) { listOf(wakeUpAt("2100-01-01T19:00:00Z")) }, rescheduled)
    }

    @Test
    fun `a time zone change moves the alarm to the chosen time in the new zone`() {
        application.studyReminderStore.choose(onAtSevenPm)
        application.studyReminderStore.fold { wordsWaitingIn2100 }
        TimeZone.setDefault(TimeZone.getTimeZone("America/New_York"))

        StudyReminderReceiver().onReceive(application, Intent(Intent.ACTION_TIMEZONE_CHANGED))

        assertEquals(listOf(wakeUpAt("2100-01-01T00:00:00Z")), alarms.scheduledAlarms.map(::seenAlarmOf))
    }

    @Test
    fun `the alarm posts the stored line in the stored scaffold language`() {
        application.studyReminderStore.choose(onAtSevenPm)
        application.studyReminderStore.fold {
            StudyReminderFacts(cardsWaitingFrom = Instant.parse("2026-01-01T00:00:00Z"))
        }
        application.studyReminderStore.nameLanguage(PlayerLanguage(PlayerScaffold.Spanish, PlayerChromePhase.Scaffold))

        StudyReminderReceiver().onReceive(application, Intent(StudyReminderReceiver.STUDY_REMINDER_FIRED))

        val posted: List<Notification> =
            shadowOf(application.getSystemService(NotificationManager::class.java)).allNotifications
        assertEquals(
            listOf("Tus palabras están listas."),
            posted.map { notification: Notification ->
                notification.extras.getCharSequence(Notification.EXTRA_TITLE).toString()
            },
        )
    }
}
