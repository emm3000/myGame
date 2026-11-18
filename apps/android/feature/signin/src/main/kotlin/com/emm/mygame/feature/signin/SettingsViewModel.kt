package com.emm.mygame.feature.signin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.network.PlayerScaffold
import com.emm.mygame.core.network.ReminderNotifications
import com.emm.mygame.core.network.RestoreResult
import com.emm.mygame.core.network.ScaffoldChangeResult
import com.emm.mygame.core.network.SessionRepository
import com.emm.mygame.core.network.StudyReminderChoice
import com.emm.mygame.core.network.StudyReminderSettings
import com.emm.mygame.core.network.ThemePick
import com.emm.mygame.core.network.ThemeSettings
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.launch

class SettingsViewModel(
    private val sessions: SessionRepository,
    private val playerScaffold: StateFlow<PlayerScaffold?>,
    private val reminders: StudyReminderSettings,
    private val notifications: ReminderNotifications,
    private val themes: ThemeSettings,
) : ViewModel() {

    private val _state: MutableStateFlow<SettingsUiState> = MutableStateFlow(SettingsUiState.Loading)

    val state: StateFlow<SettingsUiState> = _state.asStateFlow()

    private val _effects: Channel<SettingsEffect> = Channel(Channel.BUFFERED)

    val effects: Flow<SettingsEffect> = _effects.receiveAsFlow()

    init {
        read()
        viewModelScope.launch { playerScaffold.collect(::holdStored) }
        viewModelScope.launch { reminders.choice.collect { drawReminder(SettingsUiState.NotificationAsk.Untouched) } }
        viewModelScope.launch { themes.pick.collect(::drawTheme) }
    }

    fun onIntent(intent: SettingsIntent) {
        when (intent) {
            is SettingsIntent.ScaffoldPicked -> change(intent.scaffold)
            SettingsIntent.RetryTapped -> retry()
            is SettingsIntent.ReminderSwitched -> switchReminder(intent.isOn)
            is SettingsIntent.NotificationsAnswered -> answerAsk(intent.isGranted)
            is SettingsIntent.ReminderStepped -> stepReminder(intent.step)
            SettingsIntent.ScreenResumed -> drawReminder(shownAsk())
            is SettingsIntent.ThemePicked -> themes.choose(intent.pick)
        }
    }

    private fun read() {
        _state.value = SettingsUiState.Loading
        viewModelScope.launch {
            val session: RestoreResult = sessions.restore()
            val reminder: SettingsUiState.Reminder = reminderAsked(SettingsUiState.NotificationAsk.Untouched)
            _state.value = settingsOf(session, playerScaffold.value, reminder, themes.pick.value)
        }
    }

    private fun reminderAsked(ask: SettingsUiState.NotificationAsk): SettingsUiState.Reminder {
        val choice: StudyReminderChoice = reminders.choice.value
        val isAllowed: Boolean = notifications.areAllowed
        val isShownOn: Boolean = choice.isOn && isAllowed
        val kept: SettingsUiState.NotificationAsk =
            if (isShownOn) SettingsUiState.NotificationAsk.Untouched else askWhileOff(ask, choice.isOn, isAllowed)
        return SettingsUiState.Reminder(isOn = isShownOn, time = choice.time, ask = kept)
    }

    private fun askWhileOff(
        ask: SettingsUiState.NotificationAsk,
        isChosenOn: Boolean,
        isAllowed: Boolean,
    ): SettingsUiState.NotificationAsk = when {
        ask == SettingsUiState.NotificationAsk.Asking -> ask
        isChosenOn -> SettingsUiState.NotificationAsk.Denied
        isAllowed -> SettingsUiState.NotificationAsk.Untouched
        else -> ask
    }

    private fun shownAsk(): SettingsUiState.NotificationAsk =
        (_state.value as? SettingsUiState.Loaded)?.reminder?.ask ?: SettingsUiState.NotificationAsk.Untouched

    private fun drawReminder(ask: SettingsUiState.NotificationAsk) {
        val loaded: SettingsUiState.Loaded = _state.value as? SettingsUiState.Loaded ?: return
        _state.value = loaded.copy(reminder = reminderAsked(ask))
    }

    private fun switchReminder(isOn: Boolean) {
        val loaded: SettingsUiState.Loaded = _state.value as? SettingsUiState.Loaded ?: return
        if (loaded.reminder.ask == SettingsUiState.NotificationAsk.Asking) return
        if (!isOn) return chooseReminder(isOn = false)
        if (notifications.areAllowed) return chooseReminder(isOn = true)
        if (!notifications.canAsk) return drawReminder(SettingsUiState.NotificationAsk.Denied)
        drawReminder(SettingsUiState.NotificationAsk.Asking)
        _effects.trySend(SettingsEffect.AskNotifications)
    }

    private fun answerAsk(isGranted: Boolean) {
        if (isGranted && notifications.areAllowed) return chooseReminder(isOn = true)
        if (shownAsk() != SettingsUiState.NotificationAsk.Asking) return
        drawReminder(SettingsUiState.NotificationAsk.Denied)
    }

    private fun stepReminder(step: ReminderStep) {
        val choice: StudyReminderChoice = reminders.choice.value
        if (!choice.isOn) return
        reminders.choose(choice.copy(time = choice.time.stepped(step)))
    }

    private fun chooseReminder(isOn: Boolean) {
        reminders.choose(reminders.choice.value.copy(isOn = isOn))
        drawReminder(SettingsUiState.NotificationAsk.Untouched)
    }

    private fun drawTheme(pick: ThemePick) {
        val loaded: SettingsUiState.Loaded = _state.value as? SettingsUiState.Loaded ?: return
        _state.value = loaded.copy(theme = pick)
    }

    private fun holdStored(held: PlayerScaffold?) {
        val loaded: SettingsUiState.Loaded = _state.value as? SettingsUiState.Loaded ?: return
        val stored: PlayerScaffold = held ?: return
        _state.value = loaded.copy(stored = stored)
    }

    private fun retry() {
        if (_state.value == SettingsUiState.Failed) read()
    }

    private fun change(scaffold: PlayerScaffold) {
        val loaded: SettingsUiState.Loaded = _state.value as? SettingsUiState.Loaded ?: return
        if (loaded.isSaving || scaffold == loaded.stored) return
        _state.value = loaded.copy(change = SettingsUiState.Change.Saving(scaffold))
        viewModelScope.launch {
            answered(sessions.changeScaffold(scaffold))
        }
    }

    private fun answered(answer: ScaffoldChangeResult) {
        val current: SettingsUiState.Loaded = _state.value as? SettingsUiState.Loaded ?: return
        val stored: PlayerScaffold = playerScaffold.value ?: current.stored
        _state.value = current.copy(stored = stored, change = changeOf(answer))
    }
}

private fun settingsOf(
    read: RestoreResult,
    held: PlayerScaffold?,
    reminder: SettingsUiState.Reminder,
    theme: ThemePick,
): SettingsUiState = when (read) {
    is RestoreResult.SignedIn -> storedSettingsOf(held ?: read.player.scaffold, reminder, theme)
    RestoreResult.SignedOut, RestoreResult.Unreachable -> SettingsUiState.Failed
}

private fun storedSettingsOf(
    stored: PlayerScaffold?,
    reminder: SettingsUiState.Reminder,
    theme: ThemePick,
): SettingsUiState {
    if (stored == null) return SettingsUiState.Failed
    return SettingsUiState.Loaded(
        stored = stored,
        change = SettingsUiState.Change.Untouched,
        reminder = reminder,
        theme = theme,
    )
}

private fun changeOf(answer: ScaffoldChangeResult): SettingsUiState.Change = when (answer) {
    is ScaffoldChangeResult.Changed -> savedOf(answer.player.scaffold)
    ScaffoldChangeResult.Refused -> SettingsUiState.Change.Refused
    ScaffoldChangeResult.Unreachable -> SettingsUiState.Change.Unreachable
}

private fun savedOf(answered: PlayerScaffold?): SettingsUiState.Change =
    if (answered == null) SettingsUiState.Change.Unreachable else SettingsUiState.Change.Saved
