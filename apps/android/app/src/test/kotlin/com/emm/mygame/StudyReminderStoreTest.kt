package com.emm.mygame

import android.content.Context
import android.content.SharedPreferences
import com.emm.mygame.core.network.PlayerChromePhase
import com.emm.mygame.core.network.PlayerLanguage
import com.emm.mygame.core.network.PlayerScaffold
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

    private val store: StudyReminderStore = StudyReminderStore(preferences, onChange = { _, _ -> })

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

        val restarted: StudyReminderStore = StudyReminderStore(preferencesFile(), onChange = { _, _ -> })

        assertEquals(heldFacts, restarted.facts.value)
    }

    @Test
    fun `a new store over the same file reads the stored switch`() {
        store.choose(StudyReminderChoice(isOn = true, time = LocalTime.of(19, 0)))

        val restarted: StudyReminderStore = StudyReminderStore(preferencesFile(), onChange = { _, _ -> })

        assertEquals(true, restarted.choice.value.isOn)
    }

    @Test
    fun `a new store over the same file reads the stored time`() {
        store.choose(StudyReminderChoice(isOn = false, time = LocalTime.of(21, 15)))

        val restarted: StudyReminderStore = StudyReminderStore(preferencesFile(), onChange = { _, _ -> })

        assertEquals(LocalTime.of(21, 15), restarted.choice.value.time)
    }

    @Test
    fun `a malformed stored instant reads as no fact`() {
        preferences.edit().putString("cards_waiting_from", "next tuesday").commit()

        val restarted: StudyReminderStore = StudyReminderStore(preferencesFile(), onChange = { _, _ -> })

        assertEquals(StudyReminderFacts(), restarted.facts.value)
    }

    @Test
    fun `a fold that changes no fact writes nothing`() {
        val counted: EditCountingPreferences = EditCountingPreferences(preferences)
        val countedStore: StudyReminderStore = StudyReminderStore(counted, onChange = { _, _ -> })
        countedStore.fold { heldFacts }

        countedStore.fold { heldFacts }

        assertEquals(1, counted.editCount)
    }

    @Test
    fun `a new store over the same file reads the named language`() {
        val spanishScaffold: PlayerLanguage = PlayerLanguage(PlayerScaffold.Spanish, PlayerChromePhase.Both)
        store.nameLanguage(spanishScaffold)

        val restarted: StudyReminderStore = StudyReminderStore(preferencesFile(), onChange = { _, _ -> })

        assertEquals(spanishScaffold, restarted.language)
    }

    @Test
    fun `tells the alarm every change of the choice or the facts`() {
        val told: MutableList<Pair<StudyReminderChoice, StudyReminderFacts>> = mutableListOf()
        val watchedStore: StudyReminderStore =
            StudyReminderStore(preferences, onChange = { choice, facts -> told.add(choice to facts) })
        val reminderOn: StudyReminderChoice = StudyReminderChoice(isOn = true, time = LocalTime.of(19, 0))

        watchedStore.choose(reminderOn)
        watchedStore.fold { heldFacts }
        watchedStore.fold { heldFacts }

        assertEquals(listOf(reminderOn to StudyReminderFacts(), reminderOn to heldFacts), told)
    }

    @Test
    fun `tells the alarm the cleared state once cleared`() {
        val told: MutableList<Pair<StudyReminderChoice, StudyReminderFacts>> = mutableListOf()
        val watchedStore: StudyReminderStore =
            StudyReminderStore(preferences, onChange = { choice, facts -> told.add(choice to facts) })
        watchedStore.fold { heldFacts }
        told.clear()

        watchedStore.clear()

        assertEquals(listOf(StudyReminderChoice.firstChoice to StudyReminderFacts()), told)
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
