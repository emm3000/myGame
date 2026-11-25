package com.emm.mygame.feature.today

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.town.HeldTown
import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.model.town.TownRepository
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.school.TownLessonResult
import com.emm.mygame.core.model.town.serverNow
import com.emm.mygame.core.projection.repaintDelay
import kotlinx.coroutines.Job
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.launch
import kotlin.time.Clock
import kotlin.time.Duration
import kotlin.time.Instant

class TodayViewModel(private val towns: TownRepository, private val clock: Clock) : ViewModel() {

    private val _state: MutableStateFlow<TodayUiState> = MutableStateFlow(TodayUiState.Loading)

    val state: StateFlow<TodayUiState> = _state.asStateFlow()

    private val _effects: Channel<TodayEffect> = Channel(Channel.BUFFERED)

    val effects: Flow<TodayEffect> = _effects.receiveAsFlow()

    private var held: HeldTown? = null

    private var start: TodayUiState.StartStatus = TodayUiState.StartStatus.Idle

    private var isShown: Boolean = false

    private var reading: Job? = null

    private var following: Job? = null

    init {
        viewModelScope.launch { towns.town.collect(::hold) }
    }

    fun onIntent(intent: TodayIntent) {
        when (intent) {
            TodayIntent.ScreenShown -> show()
            TodayIntent.ScreenHidden -> hide()
            TodayIntent.RetryTapped -> if (_state.value == TodayUiState.Failed) read()
            is TodayIntent.StudyTapped -> study(intent.lesson)
        }
    }

    private fun show() {
        isShown = true
        read()
        follow()
    }

    private fun hide() {
        isShown = false
        following?.cancel()
    }

    private fun read() {
        if (reading?.isActive == true) return
        if (held == null) _state.value = TodayUiState.Loading
        reading = viewModelScope.launch {
            when (towns.read()) {
                is TownReadResult.Read -> Unit
                TownReadResult.NoTown -> _effects.send(TodayEffect.NoTown)
                TownReadResult.Unreachable -> if (held == null) _state.value = TodayUiState.Failed
            }
        }
    }

    private fun study(lesson: LessonId) {
        if (held == null || start == TodayUiState.StartStatus.Starting) return
        start = TodayUiState.StartStatus.Starting
        draw()
        viewModelScope.launch {
            start = when (val answer: TownLessonResult = towns.startLesson(lesson)) {
                is TownLessonResult.Answered -> TodayUiState.StartStatus.Idle
                is TownLessonResult.Refused -> TodayUiState.StartStatus.Refused(answer.refusal)
                TownLessonResult.Unreachable -> TodayUiState.StartStatus.Unreachable
            }
            draw()
        }
    }

    private fun hold(next: HeldTown?) {
        held = next
        if (start != TodayUiState.StartStatus.Starting) start = TodayUiState.StartStatus.Idle
        draw()
        follow()
    }

    private fun follow() {
        following?.cancel()
        if (!isShown || held?.town?.lessonSlot == null) return
        following = viewModelScope.launch {
            while (true) {
                val town: TownSnapshot = held?.town ?: return@launch
                val now: Instant = now()
                val finishesAt: Instant = town.lessonSlot?.finishesAt ?: return@launch
                if (finishesAt <= now) {
                    towns.read()
                    return@launch
                }
                delay(repaintDelay(finishesAt - now))
                draw()
            }
        }
    }

    private fun draw() {
        val shown: HeldTown = held ?: return
        _state.value = shown.town.todayAt(now(), shown.gap, start)
    }

    private fun now(): Instant = serverNow(clock, held?.gap ?: Duration.ZERO)
}
