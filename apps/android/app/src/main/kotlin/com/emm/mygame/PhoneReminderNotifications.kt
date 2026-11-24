package com.emm.mygame

import android.app.NotificationManager
import android.content.Context
import android.os.Build
import com.emm.mygame.core.model.reminder.ReminderNotifications

internal class PhoneReminderNotifications(context: Context) : ReminderNotifications {

    private val notifications: NotificationManager = context.getSystemService(NotificationManager::class.java)

    override val areAllowed: Boolean
        get() = notifications.areNotificationsEnabled()

    override val canAsk: Boolean
        get() = Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
}
