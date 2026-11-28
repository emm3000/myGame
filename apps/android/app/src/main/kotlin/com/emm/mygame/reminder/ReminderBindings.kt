package com.emm.mygame.reminder

import android.content.Context
import com.emm.mygame.core.model.reminder.ReminderNotifications
import com.emm.mygame.core.model.reminder.StudyAnswerSink
import com.emm.mygame.core.model.reminder.StudyReminderSettings
import com.emm.mygame.core.network.reminder.StudyAnswers
import java.time.ZoneId
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import org.koin.android.ext.koin.androidContext
import org.koin.core.module.Module
import org.koin.dsl.bind
import org.koin.dsl.module

val reminderBindings: Module
    get() = module {
        single { StudyReminderAlarm(context = androidContext(), clock = get(), zone = ZoneId::systemDefault) }
        single {
            StudyReminderStore(
                preferences = androidContext().getSharedPreferences(STUDY_REMINDER_FILE_NAME, Context.MODE_PRIVATE),
                onChange = get<StudyReminderAlarm>()::schedule,
            )
        } bind StudyReminderSettings::class
        single {
            StudyReminderSink(
                store = inject(),
                towns = { get() },
                scope = CoroutineScope(SupervisorJob() + Dispatchers.Default),
            )
        } bind StudyAnswerSink::class
        single { StudyAnswers(tokenStore = get(), sink = get()) }
        single { PhoneReminderNotifications(context = androidContext()) } bind ReminderNotifications::class
    }

private const val STUDY_REMINDER_FILE_NAME: String = "study_reminder"
