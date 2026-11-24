package com.emm.mygame.core.testing

import com.emm.mygame.core.model.reminder.StudyReminderChoice
import com.emm.mygame.core.model.reminder.StudyReminderSettings
import java.util.concurrent.CopyOnWriteArrayList
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class FakeStudyReminderSettings(first: StudyReminderChoice) : StudyReminderSettings {

    private val _choice: MutableStateFlow<StudyReminderChoice> = MutableStateFlow(first)

    override val choice: StateFlow<StudyReminderChoice> = _choice.asStateFlow()

    private val _chosen: MutableList<StudyReminderChoice> = CopyOnWriteArrayList()

    val chosen: List<StudyReminderChoice>
        get() = _chosen.toList()

    override fun choose(choice: StudyReminderChoice) {
        _chosen += choice
        _choice.value = choice
    }
}
