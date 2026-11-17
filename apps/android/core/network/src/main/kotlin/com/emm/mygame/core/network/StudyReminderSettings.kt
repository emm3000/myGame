package com.emm.mygame.core.network

import kotlinx.coroutines.flow.StateFlow

interface StudyReminderSettings {

    val choice: StateFlow<StudyReminderChoice>

    fun choose(choice: StudyReminderChoice)
}
