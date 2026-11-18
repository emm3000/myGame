package com.emm.mygame

import android.app.AlarmManager
import android.app.Application
import android.content.Context
import com.emm.mygame.core.network.StudyReminderChoice
import com.emm.mygame.core.network.ThemePick
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
import org.robolectric.util.ReflectionHelpers
import org.robolectric.util.ReflectionHelpers.ClassParameter

@RunWith(RobolectricTestRunner::class)
class MyGameApplicationTest {

    private val application: MyGameApplication = RuntimeEnvironment.getApplication() as MyGameApplication

    private val phoneZone: TimeZone = TimeZone.getDefault()

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
    fun `a start schedules the stored reminder the system dropped`() {
        application.studyReminderStore.choose(StudyReminderChoice(isOn = true, time = LocalTime.of(19, 0)))
        application.studyReminderStore.fold {
            StudyReminderFacts(cardsWaitingFrom = Instant.parse("2100-01-01T00:00:00Z"))
        }
        alarms.scheduledAlarms.mapNotNull { scheduled -> scheduled.operation }.forEach(alarmManager::cancel)

        nextProcessOf(application).onCreate()

        assertEquals(listOf(wakeUpAt("2100-01-01T19:00:00Z")), alarms.scheduledAlarms.map(::seenAlarmOf))
    }

    @Test
    fun `a new process reads the stored theme`() {
        application.themes.choose(ThemePick.Dark)

        assertEquals(ThemePick.Dark, nextProcessOf(application).themes.pick.value)
    }

    @Test
    fun `the theme outlives the study reminder's clear, which every sign-out runs`() {
        application.themes.choose(ThemePick.Light)

        application.studyReminderStore.clear()

        assertEquals(ThemePick.Light, nextProcessOf(application).themes.pick.value)
    }

    private fun nextProcessOf(running: MyGameApplication): MyGameApplication {
        val next = MyGameApplication()
        ReflectionHelpers.callInstanceMethod<Unit>(
            Application::class.java,
            next,
            "attach",
            ClassParameter.from(Context::class.java, running.baseContext),
        )
        return next
    }
}
