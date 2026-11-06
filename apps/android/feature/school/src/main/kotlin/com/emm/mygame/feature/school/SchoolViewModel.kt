package com.emm.mygame.feature.school

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.TownLessonResult
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
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

private val failedReadRetry: Duration = 1.minutes

class SchoolViewModel(private val towns: TownRepository, private val clock: Clock) : ViewModel() {

    private val _state: MutableStateFlow<SchoolUiState> = MutableStateFlow(SchoolUiState.Loading)

    val state: StateFlow<SchoolUiState> = _state.asStateFlow()

    private val _effects: Channel<SchoolEffect> = Channel(Channel.BUFFERED)

    val effects: Flow<SchoolEffect> = _effects.receiveAsFlow()

    private var projection: Job? = null

    private var shown: TownSnapshot? = null

    private var mutations: SchoolMutations = SchoolMutations.none

    private var selected: LessonId? = null

    private var gap: Duration = Duration.ZERO

    private var isShown: Boolean = true

    init {
        open()
    }

    fun onIntent(intent: SchoolIntent) {
        when (intent) {
            SchoolIntent.ScreenShown -> show()
            SchoolIntent.ScreenHidden -> hide()
            SchoolIntent.RetryTapped -> if (_state.value == SchoolUiState.Failed) open()
            is SchoolIntent.LessonSelected -> select(intent.lesson)
            is SchoolIntent.StudyTapped -> start(intent.lesson)
            is SchoolIntent.StopTapped -> stop(intent.lesson)
        }
    }

    private fun show() {
        if (isShown) return
        isShown = true
        val last: TownSnapshot? = shown
        when {
            last != null -> projection = viewModelScope.launch { project(last, firstReadAt = serverNow()) }
            _state.value == SchoolUiState.Loading -> open()
        }
    }

    private fun hide() {
        isShown = false
        projection?.cancel()
    }

    private fun open() {
        _state.value = SchoolUiState.Loading
        projection = viewModelScope.launch {
            when (val answer: TownReadResult = towns.read()) {
                is TownReadResult.Read -> {
                    val town: TownSnapshot = measured(answer.town)
                    project(town, firstReadAt = town.nextChangeAfter(serverNow()))
                }
                TownReadResult.NoTown -> _effects.send(SchoolEffect.NoTown)
                TownReadResult.Unreachable -> _state.value = SchoolUiState.Failed
            }
        }
    }

    private fun select(lesson: LessonId) {
        selected = lesson
        _state.update { current: SchoolUiState ->
            if (current is SchoolUiState.Content) current.copy(selected = lesson) else current
        }
    }

    private fun start(lesson: LessonId) {
        if (mutations.start == SchoolUiState.LessonRequest.Waiting) return
        drawMutations(mutations.copy(start = SchoolUiState.LessonRequest.Waiting))
        viewModelScope.launch {
            when (val answer: TownLessonResult = towns.startLesson(lesson)) {
                is TownLessonResult.Answered ->
                    restartFrom(answer.town, mutations.keptAfterRead().copy(start = SchoolUiState.LessonRequest.Idle))
                is TownLessonResult.Refused ->
                    drawMutations(mutations.copy(start = SchoolUiState.LessonRequest.Refused(lesson, answer.refusal)))
                TownLessonResult.Unreachable ->
                    drawMutations(mutations.copy(start = SchoolUiState.LessonRequest.Unreachable(lesson)))
            }
        }
    }

    private fun stop(lesson: LessonId) {
        if (mutations.stop == SchoolUiState.LessonRequest.Waiting) return
        drawMutations(mutations.copy(stop = SchoolUiState.LessonRequest.Waiting))
        viewModelScope.launch {
            when (val answer: TownLessonResult = towns.stopLesson(lesson)) {
                is TownLessonResult.Answered ->
                    restartFrom(answer.town, mutations.keptAfterRead().copy(stop = SchoolUiState.LessonRequest.Idle))
                is TownLessonResult.Refused ->
                    drawMutations(mutations.copy(stop = SchoolUiState.LessonRequest.Refused(lesson, answer.refusal)))
                TownLessonResult.Unreachable ->
                    drawMutations(mutations.copy(stop = SchoolUiState.LessonRequest.Unreachable(lesson)))
            }
        }
    }

    private fun restartFrom(town: TownSnapshot, kept: SchoolMutations) {
        projection?.cancel()
        mutations = kept
        draw(town)
        if (isShown) {
            projection = viewModelScope.launch { project(town, firstReadAt = town.nextChangeAfter(serverNow())) }
        }
    }

    private fun drawMutations(next: SchoolMutations) {
        mutations = next
        _state.update { current: SchoolUiState ->
            if (current is SchoolUiState.Content) current.copy(start = next.start, stop = next.stop) else current
        }
    }

    private fun draw(town: TownSnapshot) {
        shown = town
        _state.value = town.contentAt(now = serverNow(), mutations = mutations, selected = selected)
    }

    private suspend fun project(first: TownSnapshot, firstReadAt: Instant?) {
        var town: TownSnapshot = first
        var nextReadAt: Instant? = firstReadAt
        while (true) {
            draw(town)
            if (nextReadAt != null && nextReadAt <= serverNow()) {
                when (val answer: TownReadResult = towns.read()) {
                    is TownReadResult.Read -> {
                        town = measured(answer.town)
                        mutations = mutations.keptAfterRead()
                        nextReadAt = town.nextChangeAfter(serverNow())
                        continue
                    }
                    TownReadResult.NoTown -> return _effects.send(SchoolEffect.NoTown)
                    TownReadResult.Unreachable -> nextReadAt = serverNow() + failedReadRetry
                }
            }
            delay(nextWakeFrom(town, nextReadAt))
        }
    }

    private fun nextWakeFrom(town: TownSnapshot, nextReadAt: Instant?): Duration {
        val now: Instant = serverNow()
        val repaint: Duration = repaintDelay(town.lessonRemainingAt(now))
        return if (nextReadAt == null) repaint else minOf(repaint, nextReadAt - now)
    }

    private fun serverNow(): Instant = clock.now() + gap

    private fun measured(read: TownSnapshot): TownSnapshot {
        gap = read.readAt - clock.now()
        return read
    }
}
