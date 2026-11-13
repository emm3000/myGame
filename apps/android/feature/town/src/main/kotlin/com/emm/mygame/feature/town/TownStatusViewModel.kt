package com.emm.mygame.feature.town

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.network.HeldTown
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.NextStep
import com.emm.mygame.core.network.TownRepository
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.network.nameOf
import com.emm.mygame.core.network.registeredBetween
import com.emm.mygame.core.projection.countdownTo
import com.emm.mygame.core.projection.repaintDelay
import kotlin.time.Clock
import kotlin.time.Duration
import kotlin.time.Instant
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class TownStatusViewModel(private val towns: TownRepository, private val clock: Clock) : ViewModel() {

    private val _state: MutableStateFlow<TownStatusUiState> = MutableStateFlow(TownStatusUiState.none)

    val state: StateFlow<TownStatusUiState> = _state.asStateFlow()

    private var held: TownSnapshot? = null

    private var finished: LessonId? = null

    private var screen: TownStatusScreen = TownStatusScreen.Outside

    private var gap: Duration = Duration.ZERO

    private var isShown: Boolean = false

    private var following: Job? = null

    init {
        viewModelScope.launch { towns.town.collect { next: HeldTown? -> hold(next?.town) } }
    }

    fun onIntent(intent: TownStatusIntent) {
        when (intent) {
            is TownStatusIntent.ScreenShown -> show(intent.screen)
            TownStatusIntent.ScreenHidden -> hide()
            TownStatusIntent.NoticeClosed -> {
                finished = null
                draw()
            }
        }
    }

    private fun show(shown: TownStatusScreen) {
        screen = shown
        isShown = true
        if (shown == TownStatusScreen.Outside) {
            held = null
            finished = null
        }
        restart()
    }

    private fun hide() {
        isShown = false
        following?.cancel()
    }

    private fun hold(next: TownSnapshot?) {
        val previous: TownSnapshot? = held
        held = next
        if (next != null) gap = next.readAt - clock.now()
        if (next != null && previous != null) finished = registeredBetween(previous, next).finishedLesson ?: finished
        restart()
    }

    private fun restart() {
        closeAtTheDoor()
        draw()
        following?.cancel()
        if (isShown && held?.lessonSlot != null) following = viewModelScope.launch { follow() }
    }

    private fun closeAtTheDoor() {
        val reviews: NextStep.Reviews? = held?.nextStep as? NextStep.Reviews
        if (reviews == null || screen.isDoorTo(reviews.readFirst.firstOrNull())) finished = null
    }

    private fun draw() {
        val town: TownSnapshot? = held
        val isDrawn: Boolean = town != null && screen != TownStatusScreen.Outside
        _state.value = if (isDrawn) town.statusAt(serverNow(), gap, finished) else TownStatusUiState.none
    }

    private suspend fun follow() {
        while (true) {
            delay(repaintDelay(held?.lessonSlot?.finishesAt?.minus(serverNow())))
            draw()
            if (!screen.readsTown() && held?.isLessonDueAt(serverNow()) == true) towns.read()
        }
    }

    private fun serverNow(): Instant = clock.now() + gap
}

private fun TownStatusScreen.readsTown(): Boolean = when (this) {
    TownStatusScreen.ReadsTown, is TownStatusScreen.LessonWords -> true
    TownStatusScreen.Outside, TownStatusScreen.ReadsNoTown, TownStatusScreen.Reviews -> false
}

private fun TownStatusScreen.isDoorTo(firstUnread: LessonId?): Boolean = when (this) {
    TownStatusScreen.Reviews -> true
    is TownStatusScreen.LessonWords -> lesson == firstUnread
    TownStatusScreen.Outside, TownStatusScreen.ReadsTown, TownStatusScreen.ReadsNoTown -> false
}

private fun TownSnapshot.isLessonDueAt(now: Instant): Boolean {
    val finishesAt: Instant = lessonSlot?.finishesAt ?: return false
    return finishesAt > readAt && finishesAt <= now
}

private fun TownSnapshot.statusAt(now: Instant, gap: Duration, finished: LessonId?): TownStatusUiState =
    TownStatusUiState(
        running = lessonSlot?.let { slot: TownSnapshot.LessonSlot ->
            TownStatusUiState.RunningLesson(
                name = nameOf(slot.lesson),
                remaining = countdownTo(finishesAt = slot.finishesAt, now = now),
                finishesAt = slot.finishesAt - gap,
            )
        },
        notice = finished?.let { lesson: LessonId ->
            TownStatusUiState.FinishNotice(nameOf(lesson), (nextStep as? NextStep.Reviews)?.readFirst?.firstOrNull())
        },
    )
