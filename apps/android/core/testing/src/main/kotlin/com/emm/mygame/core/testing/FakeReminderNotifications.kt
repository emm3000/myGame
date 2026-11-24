package com.emm.mygame.core.testing

import com.emm.mygame.core.model.reminder.ReminderNotifications

class FakeReminderNotifications(override var areAllowed: Boolean, override val canAsk: Boolean) : ReminderNotifications
