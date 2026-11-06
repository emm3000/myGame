package com.emm.mygame.feature.school

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.network.ReportReadResult
import com.emm.mygame.core.network.ReportRepository
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownRepository
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.projection.repaintDelay
import kotlin.time.Clock
import kotlin.time.Duration
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Instant
import kotlinx.coroutines.Job
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.launch

private val failedReadRetry: Duration = 1.minutes

class LessonWordsViewModel(
    private val walk: LessonWalk,
    private val towns: TownRepository,
    private val reports: ReportRepository,
    private val clock: Clock,
) : ViewModel() {

    private val _state: MutableStateFlow<LessonWordsUiState> = MutableStateFlow(LessonWordsUiState.Loading)

    val state: StateFlow<LessonWordsUiState> = _state.asStateFlow()

    private val _effects: Channel<LessonWordsEffect> = Channel(Channel.BUFFERED)

    val effects: Flow<LessonWordsEffect> = _effects.receiveAsFlow()

    private var following: Job? = null

    private var shown: LessonRead? = null

    private var wordIndex: Int = 0

    private var gap: Duration = Duration.ZERO

    private var isShown: Boolean = true

    init {
        open()
    }

    fun onIntent(intent: LessonWordsIntent) {
        when (intent) {
            LessonWordsIntent.ScreenShown -> show()
            LessonWordsIntent.ScreenHidden -> hide()
            LessonWordsIntent.RetryTapped -> if (_state.value == LessonWordsUiState.Failed) open()
            LessonWordsIntent.NextWordTapped -> showNextWord()
        }
    }

    private fun show() {
        if (isShown) return
        isShown = true
        val last: LessonRead? = shown
        when {
            last != null -> following = viewModelScope.launch { follow(last, firstReadAt = serverNow()) }
            _state.value == LessonWordsUiState.Loading -> open()
        }
    }

    private fun hide() {
        isShown = false
        following?.cancel()
    }

    private fun open() {
        _state.value = LessonWordsUiState.Loading
        following = viewModelScope.launch {
            when (val answer: LessonAnswer = read()) {
                is LessonAnswer.Read -> follow(answer.read, answer.read.nextFinishAfter(serverNow()))
                LessonAnswer.NoTown -> _effects.send(LessonWordsEffect.NoTown)
                LessonAnswer.Unreachable -> _state.value = LessonWordsUiState.Failed
            }
        }
    }

    private fun showNextWord() {
        val reading: LessonWordsUiState.Reading = _state.value as? LessonWordsUiState.Reading ?: return
        wordIndex = minOf(reading.index + 1, reading.words.lastIndex)
        _state.value = reading.copy(index = wordIndex)
    }

    private suspend fun follow(first: LessonRead, firstReadAt: Instant?) {
        var held: LessonRead = first
        var nextReadAt: Instant? = firstReadAt
        while (true) {
            draw(held)
            val readAt: Instant = nextReadAt ?: return
            if (readAt <= serverNow()) {
                when (val answer: LessonAnswer = read()) {
                    is LessonAnswer.Read -> {
                        held = answer.read
                        nextReadAt = held.nextFinishAfter(serverNow())
                        continue
                    }
                    LessonAnswer.NoTown -> return _effects.send(LessonWordsEffect.NoTown)
                    LessonAnswer.Unreachable -> nextReadAt = serverNow() + failedReadRetry
                }
            }
            delay(nextWakeFrom(held, nextReadAt))
        }
    }

    private fun nextWakeFrom(held: LessonRead, nextReadAt: Instant?): Duration {
        val now: Instant = serverNow()
        val repaint: Duration = repaintDelay(held.remainingOf(walk.lesson, now))
        return if (nextReadAt == null) repaint else minOf(repaint, nextReadAt - now)
    }

    private fun draw(read: LessonRead) {
        shown = read
        _state.value = read.stateOf(walk, wordIndex, serverNow())
    }

    private suspend fun read(): LessonAnswer {
        val town: TownSnapshot = when (val answer: TownReadResult = towns.read()) {
            is TownReadResult.Read -> answer.town
            TownReadResult.NoTown -> return LessonAnswer.NoTown
            TownReadResult.Unreachable -> return LessonAnswer.Unreachable
        }
        gap = town.readAt - clock.now()
        return when (val answer: ReportReadResult = reports.read()) {
            is ReportReadResult.Read -> LessonAnswer.Read(LessonRead(town, answer.report.readFirst))
            ReportReadResult.Unreachable -> LessonAnswer.Unreachable
        }
    }

    private fun serverNow(): Instant = clock.now() + gap

    private sealed interface LessonAnswer {

        data class Read(val read: LessonRead) : LessonAnswer

        data object NoTown : LessonAnswer

        data object Unreachable : LessonAnswer
    }
}
