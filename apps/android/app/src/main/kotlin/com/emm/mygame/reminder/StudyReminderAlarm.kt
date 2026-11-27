package com.emm.mygame.reminder

import android.app.AlarmManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import androidx.annotation.StringRes
import com.emm.mygame.MainActivity
import com.emm.mygame.R
import com.emm.mygame.StudyReminderReceiver
import com.emm.mygame.account.toCopyLanguage
import com.emm.mygame.core.model.account.PlayerLanguage
import com.emm.mygame.core.model.reminder.StudyReminderChoice
import com.emm.mygame.core.projection.StudyReminderFacts
import com.emm.mygame.core.projection.StudyReminderLine
import com.emm.mygame.core.projection.studyReminderAt
import com.emm.mygame.core.projection.studyReminderLineAt
import com.emm.mygame.core.ui.PlayerCopy
import java.time.ZoneId
import kotlin.time.Clock
import kotlin.time.Instant
import com.emm.mygame.core.designsystem.R as DesignSystemR

class StudyReminderAlarm(private val context: Context, private val clock: Clock, private val zone: () -> ZoneId) {

    private val alarms: AlarmManager = context.getSystemService(AlarmManager::class.java)

    private val notifications: NotificationManager = context.getSystemService(NotificationManager::class.java)

    private val receiver: ComponentName = ComponentName(context, StudyReminderReceiver::class.java)

    fun schedule(choice: StudyReminderChoice, facts: StudyReminderFacts) {
        keepReceiver(isEnabled = choice.isOn)
        val now: Instant = clock.now()
        val at: Instant? = if (choice.isOn) studyReminderAt(facts, choice.time, zone(), now) else null
        if (at == null || studyReminderLineAt(facts, now) == null) notifications.cancel(STUDY_REMINDER_ID)
        if (at == null) {
            alarms.cancel(firing())
            return
        }
        alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at.toEpochMilliseconds(), firing())
    }

    fun fire(choice: StudyReminderChoice, facts: StudyReminderFacts, language: PlayerLanguage?) {
        val line: StudyReminderLine? = studyReminderLineAt(facts, clock.now()).takeIf { choice.isOn }
        if (line != null && notifications.areNotificationsEnabled()) {
            post(line, PlayerCopy(context, language?.toCopyLanguage()))
        }
        schedule(choice, facts)
    }

    private fun post(line: StudyReminderLine, copy: PlayerCopy) {
        notifications.createNotificationChannel(
            NotificationChannel(
                STUDY_REMINDER_CHANNEL,
                copy.fixedCopy(R.string.reminder_channel),
                NotificationManager.IMPORTANCE_DEFAULT,
            ),
        )
        val words: ReminderWords = wordsOf(line)
        val reminder: Notification = Notification.Builder(context, STUDY_REMINDER_CHANNEL)
            .setSmallIcon(DesignSystemR.drawable.designsystem_reminder)
            .setContentTitle(copy.fixedCopy(words.title))
            .setContentText(copy.fixedCopy(words.text))
            .setContentIntent(tapping())
            .setAutoCancel(true)
            .build()
        notifications.notify(STUDY_REMINDER_ID, reminder)
    }

    private fun keepReceiver(isEnabled: Boolean) {
        val state: Int = if (isEnabled) {
            PackageManager.COMPONENT_ENABLED_STATE_ENABLED
        } else {
            PackageManager.COMPONENT_ENABLED_STATE_DISABLED
        }
        if (context.packageManager.getComponentEnabledSetting(receiver) == state) return
        context.packageManager.setComponentEnabledSetting(receiver, state, PackageManager.DONT_KILL_APP)
    }

    private fun firing(): PendingIntent = PendingIntent.getBroadcast(
        context,
        STUDY_REMINDER_ID,
        Intent(context, StudyReminderReceiver::class.java).setAction(StudyReminderReceiver.STUDY_REMINDER_FIRED),
        PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
    )

    private fun tapping(): PendingIntent = PendingIntent.getActivity(
        context,
        STUDY_REMINDER_ID,
        Intent(context, MainActivity::class.java)
            .putExtra(MainActivity.STUDY_REMINDER_TAP, true)
            .addFlags(ON_TOP_OF_THE_APP),
        PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
    )
}

private data class ReminderWords(@param:StringRes val title: Int, @param:StringRes val text: Int)

private fun wordsOf(line: StudyReminderLine): ReminderWords = when (line) {
    StudyReminderLine.Cards -> ReminderWords(R.string.reminder_cards_title, R.string.reminder_cards_text)
    StudyReminderLine.Check -> ReminderWords(R.string.reminder_check_title, R.string.reminder_check_text)
    StudyReminderLine.Lesson -> ReminderWords(R.string.reminder_lesson_title, R.string.reminder_lesson_text)
}

private const val STUDY_REMINDER_ID: Int = 1

private const val STUDY_REMINDER_CHANNEL: String = "study_reminders"

private const val ON_TOP_OF_THE_APP: Int =
    Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
