package com.emm.mygame.core.model.reminder

import kotlinx.coroutines.flow.StateFlow

interface StudyReminderSettings {

    val choice: StateFlow<StudyReminderChoice>

    fun choose(choice: StudyReminderChoice)
}
