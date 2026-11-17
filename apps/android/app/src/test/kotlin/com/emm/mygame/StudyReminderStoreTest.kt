package com.emm.mygame

import android.content.Context
import android.content.SharedPreferences
import com.emm.mygame.core.network.StudyReminderChoice
import com.emm.mygame.core.projection.StudyReminderFacts
import java.time.LocalTime
import kotlin.time.Instant
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class StudyReminderStoreTest {

    private val preferences: SharedPreferences = preferencesFile()

    private val store: StudyReminderStore = StudyReminderStore(preferences)

    private val heldFacts: StudyReminderFacts = StudyReminderFacts(
        cardsWaitingFrom = Instant.parse("2026-11-19T09:00:00Z"),
        lessonFinishingAt = Instant.parse("2026-11-17T09:05:00Z"),
        isCheckDue = true,
        isLessonReady = true,
    )

    @Test
    fun `starts off at 7 PM`() {
        assertEquals(StudyReminderChoice(isOn = false, time = LocalTime.of(19, 0)), store.choice.value)
    }

    @Test
    fun `a new store over the same file reads the stored facts`() {
        store.fold { heldFacts }

        val restarted: StudyReminderStore = StudyReminderStore(preferencesFile())

        assertEquals(heldFacts, restarted.facts.value)
    }

    @Test
    fun `a new store over the same file reads the stored switch`() {
        store.choose(StudyReminderChoice(isOn = true, time = LocalTime.of(19, 0)))

        val restarted: StudyReminderStore = StudyReminderStore(preferencesFile())

        assertEquals(true, restarted.choice.value.isOn)
    }

    @Test
    fun `a new store over the same file reads the stored time`() {
        store.choose(StudyReminderChoice(isOn = false, time = LocalTime.of(21, 15)))

        val restarted: StudyReminderStore = StudyReminderStore(preferencesFile())

        assertEquals(LocalTime.of(21, 15), restarted.choice.value.time)
    }

    @Test
    fun `a malformed stored instant reads as no fact`() {
        preferences.edit().putString("cards_waiting_from", "next tuesday").commit()

        val restarted: StudyReminderStore = StudyReminderStore(preferencesFile())

        assertEquals(StudyReminderFacts(), restarted.facts.value)
    }

    @Test
    fun `a fold that changes no fact writes nothing`() {
        val counted: EditCountingPreferences = EditCountingPreferences(preferences)
        val countedStore: StudyReminderStore = StudyReminderStore(counted)
        countedStore.fold { heldFacts }

        countedStore.fold { heldFacts }

        assertEquals(1, counted.editCount)
    }

    private fun preferencesFile(): SharedPreferences =
        RuntimeEnvironment.getApplication().getSharedPreferences("study-reminder-test", Context.MODE_PRIVATE)

    private class EditCountingPreferences(private val preferences: SharedPreferences) :
        SharedPreferences by preferences {

        var editCount: Int = 0
            private set

        override fun edit(): SharedPreferences.Editor {
            editCount += 1
            return preferences.edit()
        }
    }
}
