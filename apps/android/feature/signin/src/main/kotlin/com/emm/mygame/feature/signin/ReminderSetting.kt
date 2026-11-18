package com.emm.mygame.feature.signin

import androidx.annotation.StringRes
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameSwitchRow
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTextLink
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTimeField
import com.emm.mygame.core.designsystem.MyGameTimeStep
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.ui.rememberPlayerCopy
import java.time.LocalDate
import java.time.LocalTime

private val anyDay: LocalDate = LocalDate.ofEpochDay(0)

@Composable
internal fun ReminderSetting(
    reminder: SettingsUiState.Reminder,
    onIntent: (SettingsIntent) -> Unit,
    onNotificationSettingsOpen: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step4), modifier = modifier) {
        MyGameSwitchRow(
            label = stringResource(R.string.settings_reminder_title),
            supportingText = stringResource(R.string.settings_reminder_line),
            isChecked = reminder.isOn,
            isEnabled = reminder.ask != SettingsUiState.NotificationAsk.Asking,
            onCheckedChange = { isOn: Boolean -> onIntent(SettingsIntent.ReminderSwitched(isOn)) },
        )
        if (reminder.ask == SettingsUiState.NotificationAsk.Denied) {
            MyGameInlineAlert(message = stringResource(R.string.settings_reminder_denied))
            MyGameTextLink(
                label = stringResource(R.string.settings_reminder_open_settings),
                onClick = onNotificationSettingsOpen,
            )
        }
        if (reminder.isOn) ReminderTime(time = reminder.time, onIntent = onIntent)
    }
}

@Composable
private fun ReminderTime(time: LocalTime, onIntent: (SettingsIntent) -> Unit, modifier: Modifier = Modifier) {
    val shown: String = rememberPlayerCopy().fixedCopy { timeOf(time.atDate(anyDay)) }
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameText(
            text = stringResource(R.string.settings_reminder_time),
            style = MyGameTypography.gloss,
            color = MyGameTheme.colors.ink,
        )
        MyGameTimeField(
            time = shown,
            hourEarlier = timeStep(ReminderStep.HourEarlier, onIntent),
            hourLater = timeStep(ReminderStep.HourLater, onIntent),
            minutesEarlier = timeStep(ReminderStep.MinutesEarlier, onIntent),
            minutesLater = timeStep(ReminderStep.MinutesLater, onIntent),
        )
    }
}

@Composable
private fun timeStep(step: ReminderStep, onIntent: (SettingsIntent) -> Unit): MyGameTimeStep {
    val label: String = stringResource(nameOf(step))
    return MyGameTimeStep(
        label = MyGameLabel(text = label, translation = null),
        accessibleName = label,
        onClick = { onIntent(SettingsIntent.ReminderStepped(step)) },
    )
}

@StringRes
private fun nameOf(step: ReminderStep): Int = when (step) {
    ReminderStep.HourEarlier -> R.string.settings_reminder_hour_earlier
    ReminderStep.HourLater -> R.string.settings_reminder_hour_later
    ReminderStep.MinutesEarlier -> R.string.settings_reminder_minutes_earlier
    ReminderStep.MinutesLater -> R.string.settings_reminder_minutes_later
}
