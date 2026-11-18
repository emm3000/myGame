package com.emm.mygame

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class StudyReminderReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val application: MyGameApplication = context.applicationContext as MyGameApplication
        val store: StudyReminderStore = application.studyReminderStore
        val alarm: StudyReminderAlarm = application.studyReminderAlarm
        when (intent.action) {
            STUDY_REMINDER_FIRED -> alarm.fire(store.choice.value, store.facts.value, store.language)
            Intent.ACTION_BOOT_COMPLETED,
            Intent.ACTION_TIME_CHANGED,
            Intent.ACTION_TIMEZONE_CHANGED,
            -> alarm.schedule(store.choice.value, store.facts.value)
        }
    }

    companion object {
        const val STUDY_REMINDER_FIRED: String = "com.emm.mygame.STUDY_REMINDER_FIRED"
    }
}
