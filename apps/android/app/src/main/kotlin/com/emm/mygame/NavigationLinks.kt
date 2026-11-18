package com.emm.mygame

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.emm.mygame.core.projection.StudyReminderLine

internal class NavigationLinks {

    var areEnabled: Boolean by mutableStateOf(true)

    var reminderLineOnSignIn: StudyReminderLine? = null
}
