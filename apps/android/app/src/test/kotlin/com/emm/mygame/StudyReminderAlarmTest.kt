package com.emm.mygame

import android.app.AlarmManager
import android.app.Application
import android.app.Notification
import android.app.NotificationManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import com.emm.mygame.core.model.account.PlayerChromePhase
import com.emm.mygame.core.model.account.PlayerLanguage
import com.emm.mygame.core.model.account.PlayerScaffold
import com.emm.mygame.core.model.reminder.StudyReminderChoice
import com.emm.mygame.core.projection.StudyReminderFacts
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.reminder.StudyReminderAlarm
import com.emm.mygame.reminder.StudyReminderSink
import com.emm.mygame.reminder.StudyReminderStore
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
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
class StudyReminderAlarmTest {

    private val application: Application = RuntimeEnvironment.getApplication()

    private val morning: Instant = Instant.parse("2026-11-17T10:00:00Z")

    private val alarm: StudyReminderAlarm = StudyReminderAlarm(application, clockAt(morning), zone = { ZoneOffset.UTC })

    private val onAtSevenPm: StudyReminderChoice = StudyReminderChoice(isOn = true, time = LocalTime.of(19, 0))

    private val offAtSevenPm: StudyReminderChoice = onAtSevenPm.copy(isOn = false)

    private val lessonReady: StudyReminderFacts = StudyReminderFacts(isLessonReady = true)

    private val wordsWaiting: StudyReminderFacts =
        StudyReminderFacts(cardsWaitingFrom = Instant.parse("2026-11-17T09:00:00Z"))

    private val atSevenPm: Instant = Instant.parse("2026-11-17T19:00:30Z")

    private val firingAlarm: StudyReminderAlarm =
        StudyReminderAlarm(application, clockAt(atSevenPm), zone = { ZoneOffset.UTC })

    private val englishOnly: PlayerLanguage = PlayerLanguage(PlayerScaffold.None, PlayerChromePhase.English)

    private val spanishScaffold: PlayerLanguage = PlayerLanguage(PlayerScaffold.Spanish, PlayerChromePhase.Scaffold)

    private val alarms: ShadowAlarmManager = shadowOf(application.getSystemService(AlarmManager::class.java))

    private val notifications: ShadowNotificationManager =
        shadowOf(application.getSystemService(NotificationManager::class.java))

    @Test
    fun `schedules one inexact wake-up alarm at the rule's instant`() {
        alarm.schedule(onAtSevenPm, lessonReady)

        assertEquals(listOf(wakeUpAt("2026-11-17T19:00:00Z")), alarms.scheduledAlarms.map(::seenAlarmOf))
    }

    @Test
    fun `replaces the alarm when the facts change`() {
        alarm.schedule(onAtSevenPm, lessonReady)

        alarm.schedule(onAtSevenPm, StudyReminderFacts(cardsWaitingFrom = Instant.parse("2026-11-20T08:00:00Z")))

        assertEquals(listOf(wakeUpAt("2026-11-20T19:00:00Z")), alarms.scheduledAlarms.map(::seenAlarmOf))
    }

    @Test
    fun `the receiver is enabled only while on`() {
        alarm.schedule(onAtSevenPm, lessonReady)
        val whileOn: Int = receiverState()

        alarm.schedule(offAtSevenPm, lessonReady)

        assertEquals(
            listOf(PackageManager.COMPONENT_ENABLED_STATE_ENABLED, PackageManager.COMPONENT_ENABLED_STATE_DISABLED),
            listOf(whileOn, receiverState()),
        )
    }

    @Test
    fun `a firing posts the rule's line and schedules the next day`() {
        firingAlarm.fire(onAtSevenPm, wordsWaiting, englishOnly)

        assertEquals(
            Pair(
                listOf(PostedLine("Your words are ready.", "Open Today to review them.")),
                listOf(wakeUpAt("2026-11-18T19:00:00Z")),
            ),
            Pair(postedLines(), alarms.scheduledAlarms.map(::seenAlarmOf)),
        )
    }

    @Test
    fun `posts in the scaffold language`() {
        firingAlarm.fire(onAtSevenPm, wordsWaiting, spanishScaffold)

        assertEquals(
            listOf(PostedLine("Tus palabras están listas.", "Abre Hoy para repasarlas.")),
            postedLines(),
        )
    }

    @Test
    fun `posts the check line before the lesson line when no words wait`() {
        firingAlarm.fire(onAtSevenPm, StudyReminderFacts(isCheckDue = true, isLessonReady = true), englishOnly)
        val checkLines: List<PostedLine> = postedLines()

        firingAlarm.fire(onAtSevenPm, lessonReady, englishOnly)

        assertEquals(
            listOf(
                listOf(PostedLine("Your word check is ready.", "Open it from the town.")),
                listOf(PostedLine("A lesson is ready.", "Start it from the town.")),
            ),
            listOf(checkLines, postedLines()),
        )
    }

    @Test
    fun `names the Study reminders channel in the scaffold language`() {
        firingAlarm.fire(onAtSevenPm, wordsWaiting, spanishScaffold)

        assertEquals(
            listOf("Recordatorios de estudio"),
            notifications.notificationChannels.map { channel -> channel.name.toString() },
        )
    }

    @Test
    fun `posts nothing while notifications are off`() {
        notifications.setNotificationsEnabled(false)

        firingAlarm.fire(onAtSevenPm, wordsWaiting, englishOnly)

        assertEquals(
            Pair(emptyList<PostedLine>(), listOf(wakeUpAt("2026-11-18T19:00:00Z"))),
            Pair(postedLines(), alarms.scheduledAlarms.map(::seenAlarmOf)),
        )
    }

    @Test
    fun `cancels the alarm and removes the reminder when nothing is left to study`() {
        firingAlarm.fire(onAtSevenPm, wordsWaiting, englishOnly)

        firingAlarm.schedule(onAtSevenPm, StudyReminderFacts())

        assertEquals(
            Pair(emptyList<PostedLine>(), emptyList<SeenAlarm>()),
            Pair(postedLines(), alarms.scheduledAlarms.map(::seenAlarmOf)),
        )
    }

    @Test
    fun `removes a posted reminder once nothing is left to study by now`() {
        firingAlarm.fire(onAtSevenPm, wordsWaiting, englishOnly)

        firingAlarm.schedule(
            onAtSevenPm,
            StudyReminderFacts(cardsWaitingFrom = Instant.parse("2026-11-19T09:00:00Z")),
        )

        assertEquals(emptyList<PostedLine>(), postedLines())
    }

    @Test
    fun `a tap on the reminder opens the app as a reminder's tap`() {
        firingAlarm.fire(onAtSevenPm, wordsWaiting, englishOnly)

        val opened: Intent = shadowOf(notifications.allNotifications.single().contentIntent).savedIntent
        assertEquals(
            Pair(MainActivity::class.java.name, true),
            Pair(opened.component?.className, opened.getBooleanExtra(MainActivity.STUDY_REMINDER_TAP, false)),
        )
    }

    @Test
    fun `a tap removes the reminder`() {
        firingAlarm.fire(onAtSevenPm, wordsWaiting, englishOnly)

        val posted: Notification = notifications.allNotifications.single()
        assertEquals(Notification.FLAG_AUTO_CANCEL, posted.flags and Notification.FLAG_AUTO_CANCEL)
    }

    @Test
    fun `sign-out cancels the alarm and the reminder`() = runTest {
        val store: StudyReminderStore = StudyReminderStore(
            application.getSharedPreferences("study-reminder-sign-out-test", Context.MODE_PRIVATE),
            onChange = firingAlarm::schedule,
        )
        store.choose(onAtSevenPm)
        store.fold { wordsWaiting }
        firingAlarm.fire(store.choice.value, store.facts.value, englishOnly)

        StudyReminderSink(store = lazyOf(store), towns = { FakeTownRepository() }, scope = backgroundScope)
            .sessionChanged()

        assertEquals(
            Triple(emptyList<PostedLine>(), emptyList<SeenAlarm>(), PackageManager.COMPONENT_ENABLED_STATE_DISABLED),
            Triple(postedLines(), alarms.scheduledAlarms.map(::seenAlarmOf), receiverState()),
        )
    }

    private fun postedLines(): List<PostedLine> = notifications.allNotifications.map { notification ->
        PostedLine(
            title = notification.extras.getCharSequence(Notification.EXTRA_TITLE).toString(),
            text = notification.extras.getCharSequence(Notification.EXTRA_TEXT).toString(),
        )
    }

    private fun receiverState(): Int = application.packageManager.getComponentEnabledSetting(
        ComponentName(application, StudyReminderReceiver::class.java),
    )
}

private data class PostedLine(val title: String, val text: String)
