package com.emm.mygame.feature.school

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.town.HeldTown
import com.emm.mygame.core.model.town.ReadAnswer
import com.emm.mygame.core.model.town.ReadFollower
import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.model.town.TownRepository
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.gapOf
import com.emm.mygame.core.model.town.readUntilReached
import com.emm.mygame.core.model.town.school.TownLessonResult
import com.emm.mygame.core.model.town.serverNow
import com.emm.mygame.core.projection.repaintDelay
import kotlin.time.Clock
import kotlin.time.Duration
import kotlin.time.Instant
import kotlinx.coroutines.Job
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class SchoolViewModel(private val towns: TownRepository, private val clock: Clock) : ViewModel() {

    private val _state: MutableStateFlow<SchoolUiState> = MutableStateFlow(SchoolUiState.Loading)

    val state: StateFlow<SchoolUiState> = _state.asStateFlow()

    private val _effects: Channel<SchoolEffect> = Channel(Channel.BUFFERED)

    val effects: Flow<SchoolEffect> = _effects.receiveAsFlow()

    private var projection: Job? = null

    private var shown: TownSnapshot? = null

    private var taps: SchoolTaps = SchoolTaps.none

    private var gap: Duration = Duration.ZERO

    private var isShown: Boolean = true

    private val follower: ReadFollower<TownSnapshot> = object : ReadFollower<TownSnapshot>() {
        override fun now(): Instant = serverNow(clock, gap)

        override fun draw(held: TownSnapshot): Unit = this@SchoolViewModel.draw(held)

        override suspend fun read(): ReadAnswer<TownSnapshot> {
            val answer: ReadAnswer<TownSnapshot> = readTown()
            if (answer is ReadAnswer.Read) taps = taps.copy(requests = taps.requests.keptAfterRead())
            return answer
        }

        override fun nextReadAfter(held: TownSnapshot, now: Instant): Instant? = held.nextChangeAfter(now)

        override fun repaintIn(held: TownSnapshot, now: Instant): Duration = repaintDelay(held.nearestCountdownAt(now))
    }

    init {
        open()
        viewModelScope.launch { towns.town.collect { held: HeldTown? -> held?.let(::adopt) } }
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
            last != null ->
                projection = viewModelScope.launch { follower.follow(last, firstReadAt = serverNow(clock, gap)) }
            _state.value == SchoolUiState.Loading -> open()
            _state.value == SchoolUiState.Failed -> readFirst()
        }
    }

    private fun hide() {
        isShown = false
        projection?.cancel()
    }

    private fun open() {
        val held: HeldTown? = towns.town.value
        if (held != null) return openHeld(held)
        _state.value = SchoolUiState.Loading
        readFirst()
    }

    private fun readFirst() {
        projection?.cancel()
        projection = viewModelScope.launch {
            val town: TownSnapshot =
                readUntilReached(::readTown, onUnreachable = { _state.value = SchoolUiState.Failed }) ?: return@launch
            follower.follow(town, firstReadAt = town.nextChangeAfter(serverNow(clock, gap)))
        }
    }

    private suspend fun readTown(): ReadAnswer<TownSnapshot> = when (val answer: TownReadResult = towns.read()) {
        is TownReadResult.Read -> ReadAnswer.Read(measured(answer.town))
        TownReadResult.NoTown -> {
            _effects.send(SchoolEffect.NoTown)
            ReadAnswer.Ended
        }
        TownReadResult.Unreachable -> ReadAnswer.Unreachable
    }

    private fun adopt(held: HeldTown) {
        val last: TownSnapshot = shown ?: return
        if (held.town == last) return
        gap = held.gap
        restartFrom(held.town, taps.requests.keptAfterRead())
    }

    private fun openHeld(held: HeldTown) {
        gap = held.gap
        draw(held.town)
        projection = viewModelScope.launch { follower.follow(held.town, firstReadAt = serverNow(clock, gap)) }
    }

    private fun select(lesson: LessonId) {
        taps = taps.copy(selected = lesson)
        shown?.let(::draw)
    }

    private fun start(lesson: LessonId) {
        if (taps.requests.start == SchoolUiState.LessonRequestStatus.Waiting) return
        drawRequests(taps.requests.copy(start = SchoolUiState.LessonRequestStatus.Waiting))
        viewModelScope.launch {
            when (val answer: TownLessonResult = towns.startLesson(lesson)) {
                is TownLessonResult.Answered -> {
                    restartFrom(
                        answer.town,
                        taps.requests.keptAfterRead().copy(start = SchoolUiState.LessonRequestStatus.Idle),
                    )
                    _effects.send(SchoolEffect.LessonStarted)
                }
                is TownLessonResult.Refused ->
                    drawRequests(
                        taps.requests.copy(start = SchoolUiState.LessonRequestStatus.Refused(lesson, answer.refusal)),
                    )
                TownLessonResult.Unreachable ->
                    drawRequests(taps.requests.copy(start = SchoolUiState.LessonRequestStatus.Unreachable(lesson)))
            }
        }
    }

    private fun stop(lesson: LessonId) {
        if (taps.requests.stop == SchoolUiState.LessonRequestStatus.Waiting) return
        drawRequests(taps.requests.copy(stop = SchoolUiState.LessonRequestStatus.Waiting))
        viewModelScope.launch {
            when (val answer: TownLessonResult = towns.stopLesson(lesson)) {
                is TownLessonResult.Answered ->
                    restartFrom(
                        answer.town,
                        taps.requests.keptAfterRead().copy(stop = SchoolUiState.LessonRequestStatus.Idle),
                    )
                is TownLessonResult.Refused ->
                    drawRequests(
                        taps.requests.copy(stop = SchoolUiState.LessonRequestStatus.Refused(lesson, answer.refusal)),
                    )
                TownLessonResult.Unreachable ->
                    drawRequests(taps.requests.copy(stop = SchoolUiState.LessonRequestStatus.Unreachable(lesson)))
            }
        }
    }

    private fun restartFrom(town: TownSnapshot, kept: SchoolRequests) {
        projection?.cancel()
        taps = taps.copy(requests = kept)
        draw(town)
        if (isShown) {
            projection = viewModelScope.launch {
                follower.follow(town, firstReadAt = town.nextChangeAfter(serverNow(clock, gap)))
            }
        }
    }

    private fun drawRequests(next: SchoolRequests) {
        taps = taps.copy(requests = next)
        _state.update { current: SchoolUiState ->
            if (current is SchoolUiState.Content) current.copy(start = next.start, stop = next.stop) else current
        }
    }

    private fun draw(town: TownSnapshot) {
        shown = town
        val now: Instant = serverNow(clock, gap)
        _state.value = town.contentAt(now = now, gap = gap, requests = taps.requests, selected = taps.selected)
    }

    private fun measured(read: TownSnapshot): TownSnapshot {
        gap = gapOf(read.readAt, clock)
        return read
    }
}
