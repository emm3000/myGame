package com.emm.mygame

import android.content.SharedPreferences
import com.emm.mygame.core.network.PlayerChromePhase
import com.emm.mygame.core.network.PlayerLanguage
import com.emm.mygame.core.network.PlayerScaffold
import com.emm.mygame.core.network.StudyReminderChoice
import com.emm.mygame.core.network.StudyReminderSettings
import com.emm.mygame.core.projection.StudyReminderFacts
import java.time.LocalTime
import kotlin.time.Instant
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class StudyReminderStore(
    private val preferences: SharedPreferences,
    private val onChange: (StudyReminderChoice, StudyReminderFacts) -> Unit,
) : StudyReminderSettings {

    private val holding: Any = Any()

    private val _choice: MutableStateFlow<StudyReminderChoice> = MutableStateFlow(preferences.storedChoice())

    override val choice: StateFlow<StudyReminderChoice> = _choice.asStateFlow()

    private val _facts: MutableStateFlow<StudyReminderFacts> = MutableStateFlow(preferences.storedFacts())

    val facts: StateFlow<StudyReminderFacts> = _facts.asStateFlow()

    private var _language: PlayerLanguage? = preferences.storedLanguage()

    val language: PlayerLanguage?
        get() = synchronized(holding) { _language }

    fun nameLanguage(language: PlayerLanguage) {
        synchronized(holding) {
            if (language == _language) return
            preferences.edit()
                .putString(SCAFFOLD, language.scaffold.name)
                .putString(CHROME_PHASE, language.chromePhase.name)
                .apply()
            _language = language
        }
    }

    override fun choose(choice: StudyReminderChoice) {
        synchronized(holding) {
            preferences.edit()
                .putBoolean(IS_ON, choice.isOn)
                .putInt(TIME_SECOND_OF_DAY, choice.time.toSecondOfDay())
                .apply()
            _choice.value = choice
            onChange(choice, _facts.value)
        }
    }

    fun fold(next: (StudyReminderFacts) -> StudyReminderFacts) {
        synchronized(holding) {
            val facts: StudyReminderFacts = next(_facts.value)
            if (facts == _facts.value) return
            preferences.edit()
                .putString(CARDS_WAITING_FROM, facts.cardsWaitingFrom?.toString())
                .putString(LESSON_FINISHING_AT, facts.lessonFinishingAt?.toString())
                .putBoolean(IS_CHECK_DUE, facts.isCheckDue)
                .putBoolean(IS_LESSON_READY, facts.isLessonReady)
                .apply()
            _facts.value = facts
            onChange(_choice.value, facts)
        }
    }

    fun clear() {
        synchronized(holding) {
            preferences.edit().clear().apply()
            _choice.value = StudyReminderChoice.firstChoice
            _facts.value = StudyReminderFacts()
            _language = null
            onChange(_choice.value, _facts.value)
        }
    }
}

private const val IS_ON: String = "is_on"
private const val TIME_SECOND_OF_DAY: String = "time_second_of_day"
private const val CARDS_WAITING_FROM: String = "cards_waiting_from"
private const val LESSON_FINISHING_AT: String = "lesson_finishing_at"
private const val IS_CHECK_DUE: String = "is_check_due"
private const val IS_LESSON_READY: String = "is_lesson_ready"
private const val SCAFFOLD: String = "scaffold"
private const val CHROME_PHASE: String = "chrome_phase"

private fun SharedPreferences.storedChoice(): StudyReminderChoice {
    val firstChoice: StudyReminderChoice = StudyReminderChoice.firstChoice
    return StudyReminderChoice(
        isOn = getBoolean(IS_ON, firstChoice.isOn),
        time = LocalTime.ofSecondOfDay(getInt(TIME_SECOND_OF_DAY, firstChoice.time.toSecondOfDay()).toLong()),
    )
}

private fun SharedPreferences.storedFacts(): StudyReminderFacts = StudyReminderFacts(
    cardsWaitingFrom = getString(CARDS_WAITING_FROM, null)?.let(Instant::parseOrNull),
    lessonFinishingAt = getString(LESSON_FINISHING_AT, null)?.let(Instant::parseOrNull),
    isCheckDue = getBoolean(IS_CHECK_DUE, false),
    isLessonReady = getBoolean(IS_LESSON_READY, false),
)

private fun SharedPreferences.storedLanguage(): PlayerLanguage? {
    val scaffold: PlayerScaffold =
        PlayerScaffold.entries.firstOrNull { it.name == getString(SCAFFOLD, null) } ?: return null
    val chromePhase: PlayerChromePhase =
        PlayerChromePhase.entries.firstOrNull { it.name == getString(CHROME_PHASE, null) } ?: return null
    return PlayerLanguage(scaffold, chromePhase)
}
