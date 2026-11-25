package com.emm.mygame.feature.school.words

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.model.learning.LearningRepository
import com.emm.mygame.core.model.learning.ReviewsReadResult
import com.emm.mygame.core.model.town.HeldTown
import com.emm.mygame.core.model.town.ReadAnswer
import com.emm.mygame.core.model.town.ReadFollower
import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.model.town.TownRepository
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.gapOf
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
import kotlinx.coroutines.launch

class LessonWordsViewModel(
    private val walk: LessonWalk,
    private val towns: TownRepository,
    private val learning: LearningRepository,
    private val clock: Clock,
) : ViewModel() {

    private val _state: MutableStateFlow<LessonWordsUiState> = MutableStateFlow(LessonWordsUiState.Loading)

    val state: StateFlow<LessonWordsUiState> = _state.asStateFlow()

    private val _effects: Channel<LessonWordsEffect> = Channel(Channel.BUFFERED)

    val effects: Flow<LessonWordsEffect> = _effects.receiveAsFlow()

    private var following: Job? = null

    private var shown: LessonRead? = null

    private var taps: LessonWordsTaps = LessonWordsTaps.none

    private var gap: Duration = Duration.ZERO

    private var isShown: Boolean = true

    private val follower: ReadFollower<LessonRead> = object : ReadFollower<LessonRead>() {
        override val isStoppedWithNoReadAhead: Boolean = true

        override fun now(): Instant = serverNow(clock, gap)

        override fun draw(held: LessonRead): Unit = this@LessonWordsViewModel.draw(held)

        override suspend fun read(): ReadAnswer<LessonRead> = readLesson()

        override fun nextReadAfter(held: LessonRead, now: Instant): Instant? = held.nextFinishAfter(now)

        override fun repaintIn(held: LessonRead, now: Instant): Duration =
            repaintDelay(held.remainingOf(walk.lesson, now))
    }

    init {
        open()
    }

    fun onIntent(intent: LessonWordsIntent) {
        when (intent) {
            LessonWordsIntent.ScreenShown -> show()
            LessonWordsIntent.ScreenHidden -> hide()
            LessonWordsIntent.RetryTapped -> if (_state.value == LessonWordsUiState.Failed) open()
            LessonWordsIntent.NextWordTapped -> showNextWord()
            is LessonWordsIntent.SupportTapped -> tapSupport(intent.support)
        }
    }

    private fun show() {
        if (isShown) return
        isShown = true
        val last: LessonRead? = shown
        when {
            last != null ->
                following = viewModelScope.launch { follower.follow(last, firstReadAt = serverNow(clock, gap)) }
            _state.value == LessonWordsUiState.Loading -> open()
        }
    }

    private fun hide() {
        isShown = false
        following?.cancel()
    }

    private fun open() {
        val held: HeldTown? = towns.town.value?.takeIf(::isDrawnAlone)
        if (held != null) return openHeld(held)
        _state.value = LessonWordsUiState.Loading
        following = viewModelScope.launch {
            when (val answer: ReadAnswer<LessonRead> = readLesson()) {
                is ReadAnswer.Read ->
                    follower.follow(answer.read, answer.read.nextFinishAfter(serverNow(clock, gap)))
                ReadAnswer.Ended -> Unit
                ReadAnswer.Unreachable -> _state.value = LessonWordsUiState.Failed
            }
        }
    }

    private fun isDrawnAlone(held: HeldTown): Boolean =
        LessonRead(held.town, readFirst = null).isDrawableWithoutReadFirst(walk.lesson, serverNow(clock, held.gap))

    private fun openHeld(held: HeldTown) {
        gap = held.gap
        val read: LessonRead = LessonRead(held.town, readFirst = null)
        draw(read)
        following = viewModelScope.launch { follower.follow(read, firstReadAt = serverNow(clock, gap)) }
    }

    private fun showNextWord() {
        val reading: LessonWordsUiState.Reading = _state.value as? LessonWordsUiState.Reading ?: return
        taps = LessonWordsTaps(wordIndex = minOf(reading.index + 1, reading.words.lastIndex), shownSupport = null)
        _state.value = reading.copy(index = taps.wordIndex, shownSupport = taps.shownSupport)
    }

    private fun tapSupport(support: LessonWordsUiState.ShownSupport) {
        val reading: LessonWordsUiState.Reading = _state.value as? LessonWordsUiState.Reading ?: return
        taps = taps.copy(shownSupport = if (taps.shownSupport == support) null else support)
        _state.value = reading.copy(shownSupport = taps.shownSupport)
    }

    private fun draw(read: LessonRead) {
        shown = read
        val drawnWord: TownSnapshot.WordReading? = (_state.value as? LessonWordsUiState.Reading)?.word
        val next: LessonWordsUiState = read.stateOf(walk, taps.wordIndex, taps.shownSupport, serverNow(clock, gap))
        if (next is LessonWordsUiState.Reading && drawnWord != null && next.word != drawnWord) {
            taps = taps.copy(shownSupport = null)
        }
        _state.value = if (next is LessonWordsUiState.Reading) next.copy(shownSupport = taps.shownSupport) else next
    }

    private suspend fun readLesson(): ReadAnswer<LessonRead> {
        val town: TownSnapshot = when (val answer: TownReadResult = towns.read()) {
            is TownReadResult.Read -> answer.town
            TownReadResult.NoTown -> {
                _effects.send(LessonWordsEffect.NoTown)
                return ReadAnswer.Ended
            }
            TownReadResult.Unreachable -> return ReadAnswer.Unreachable
        }
        gap = gapOf(town.readAt, clock)
        return when (val answer: ReviewsReadResult = learning.reviews()) {
            is ReviewsReadResult.Read -> ReadAnswer.Read(LessonRead(town, answer.reviews.readFirst))
            ReviewsReadResult.Unreachable -> ReadAnswer.Unreachable
        }
    }
}
