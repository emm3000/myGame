package com.emm.mygame.core.network

import java.time.LocalTime

data class StudyReminderChoice(val isOn: Boolean, val time: LocalTime) {

    companion object {
        val firstChoice: StudyReminderChoice = StudyReminderChoice(isOn = false, time = LocalTime.of(19, 0))
    }
}
