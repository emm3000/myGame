package com.emm.mygame.feature.town.status

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.town.HeldTown
import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.model.town.TownRepository
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.guidance.NextStep
import com.emm.mygame.core.model.town.nameOf
import com.emm.mygame.core.model.town.registeredBetween
import com.emm.mygame.core.model.town.school.TownLessonResult
import com.emm.mygame.core.projection.countdownTo
import com.emm.mygame.core.projection.repaintDelay
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlin.time.Clock
import kotlin.time.Duration
import kotlin.time.Instant

class TownStatusViewModel(private val towns: TownRepository, private val clock: Clock) : ViewModel() {

    private val _state: MutableStateFlow<TownStatusUiState> = MutableStateFlow(TownStatusUiState.none)

    val state: StateFlow<TownStatusUiState> = _state.asStateFlow()

    private var held: TownSnapshot? = null

    private var finished: LessonId? = null

    private var screen: TownStatusScreen = TownStatusScreen.Outside

    private var gap: Duration = Duration.ZERO

    private var isShown: Boolean = false

    private var following: Job? = null

    private var townRead: TownRead = TownRead.NotAsked

    private var reading: Job? = null

    private var lessonStart: LessonStartStatus = LessonStartStatus.Idle

    private var starting: Job? = null

    private var schoolLesson: LessonId? = null

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
            TownStatusIntent.ScreenAnswered -> readAnew()
            TownStatusIntent.TryAgainTapped -> readTown(towns::read)
            is TownStatusIntent.ReleasedLessonTapped -> startReleased(intent.lesson)
            is TownStatusIntent.SchoolLessonDrawn -> {
                schoolLesson = intent.lesson
                draw()
            }
        }
    }

    private fun show(shown: TownStatusScreen) {
        if (shown != screen) schoolLesson = null
        screen = shown
        isShown = true
        if (shown == TownStatusScreen.Outside) forget()
        restart()
        if (shown != TownStatusScreen.Outside && held == null && townRead.isAskedOnShow()) readTown(towns::read)
    }

    private fun forget() {
        held = null
        finished = null
        reading?.cancel()
        starting?.cancel()
        townRead = TownRead.NotAsked
        lessonStart = LessonStartStatus.Idle
    }

    private fun hide() {
        isShown = false
        following?.cancel()
    }

    private fun readAnew() {
        reading?.cancel()
        readTown(towns::readSentAfterNow)
    }

    private fun readTown(read: suspend () -> TownReadResult) {
        if (reading?.isActive == true) return
        if (held == null && townRead != TownRead.NoTown) townRead = TownRead.Reading
        draw()
        reading = viewModelScope.launch {
            townRead = when (read()) {
                is TownReadResult.Read -> townRead
                TownReadResult.NoTown -> TownRead.NoTown
                TownReadResult.Unreachable -> if (townRead == TownRead.Reading) TownRead.Refused else townRead
            }
            draw()
        }
    }

    private fun startReleased(lesson: LessonId) {
        if (held == null || lessonStart == LessonStartStatus.Waiting) return
        lessonStart = LessonStartStatus.Waiting
        draw()
        starting = viewModelScope.launch {
            lessonStart = when (val answer: TownLessonResult = towns.startLesson(lesson)) {
                is TownLessonResult.Answered -> LessonStartStatus.Idle
                is TownLessonResult.Refused -> LessonStartStatus.Refused(answer.refusal)
                TownLessonResult.Unreachable -> LessonStartStatus.Unreachable
            }
            draw()
        }
    }

    private fun hold(next: TownSnapshot?) {
        val previous: TownSnapshot? = held
        held = next
        if (next != null) heldAnew(next, previous)
        restart()
    }

    private fun heldAnew(next: TownSnapshot, previous: TownSnapshot?) {
        gap = next.readAt - clock.now()
        townRead = TownRead.NotAsked
        if (lessonStart != LessonStartStatus.Waiting) lessonStart = LessonStartStatus.Idle
        if (previous != null) finished = registeredBetween(previous, next).finishedLesson ?: finished
    }

    private fun restart() {
        closeAtTheDoor()
        draw()
        following?.cancel()
        if (isShown && held?.nextChangeAt() != null) following = viewModelScope.launch { follow() }
    }

    private fun closeAtTheDoor() {
        val reviews: NextStep.Reviews? = held?.nextStep as? NextStep.Reviews
        if (reviews == null || screen.isDoorTo(reviews.readFirst.firstOrNull())) finished = null
    }

    private fun draw() {
        val town: TownSnapshot? = held
        _state.value = when {
            screen == TownStatusScreen.Outside -> TownStatusUiState.none
            town == null -> TownStatusUiState(running = null, notice = null, dock = townRead.dock())
            else -> town.statusAt(serverNow(), gap, finished, statedLesson = lessonOnTheSchool())
                .copy(dock = town.dockOn(screen, serverNow(), gap, lessonStart))
        }
    }

    private suspend fun follow() {
        while (true) {
            val now: Instant = serverNow()
            delay(repaintDelay(held?.nextChangeAfter(now)?.minus(now)))
            draw()
            if (!screen.readsTown() && held?.isLessonDueAt(serverNow()) == true) towns.read()
        }
    }

    private fun serverNow(): Instant = clock.now() + gap

    private fun lessonOnTheSchool(): LessonId? = schoolLesson.takeIf { screen == TownStatusScreen.School }
}

private fun TownStatusScreen.readsTown(): Boolean = when (this) {
    TownStatusScreen.ReadsTown, TownStatusScreen.School, is TownStatusScreen.LessonWords -> true
    TownStatusScreen.Outside, TownStatusScreen.ReadsNoTown, TownStatusScreen.Report, TownStatusScreen.Reviews -> false
}

private fun TownStatusScreen.isDoorTo(firstUnread: LessonId?): Boolean = when (this) {
    TownStatusScreen.Reviews -> true
    is TownStatusScreen.LessonWords -> lesson == firstUnread
    TownStatusScreen.Outside,
    TownStatusScreen.ReadsTown,
    TownStatusScreen.School,
    TownStatusScreen.ReadsNoTown,
    TownStatusScreen.Report,
    -> false
}

private fun TownSnapshot.changesAt(): List<Instant> = listOfNotNull(lessonSlot?.finishesAt, nextDueAt)

private fun TownSnapshot.nextChangeAt(): Instant? = changesAt().minOrNull()

private fun TownSnapshot.nextChangeAfter(now: Instant): Instant? =
    changesAt().filter { instant: Instant -> instant > now }.minOrNull()

private fun TownSnapshot.isLessonDueAt(now: Instant): Boolean {
    val finishesAt: Instant = lessonSlot?.finishesAt ?: return false
    return finishesAt > readAt && finishesAt <= now
}

private fun TownSnapshot.statusAt(
    now: Instant,
    gap: Duration,
    finished: LessonId?,
    statedLesson: LessonId?,
): TownStatusUiState =
    TownStatusUiState(
        running = lessonSlot?.takeUnless { slot: TownSnapshot.LessonSlot -> slot.lesson == statedLesson }
            ?.let { slot: TownSnapshot.LessonSlot ->
                TownStatusUiState.RunningLesson(
                    name = nameOf(slot.lesson),
                    remaining = countdownTo(finishesAt = slot.finishesAt, now = now),
                    finishesAt = slot.finishesAt - gap,
                )
            },
        notice = finished?.let { lesson: LessonId ->
            TownStatusUiState.FinishNotice(nameOf(lesson))
        },
    )

private enum class TownRead { NotAsked, Reading, Refused, NoTown }

private fun TownRead.isAskedOnShow(): Boolean = when (this) {
    TownRead.NotAsked, TownRead.Refused -> true
    TownRead.Reading, TownRead.NoTown -> false
}

private fun TownRead.dock(): TownStatusUiState.Dock? = when (this) {
    TownRead.Reading -> TownStatusUiState.Dock.Loading
    TownRead.Refused -> TownStatusUiState.Dock.Refused
    TownRead.NotAsked, TownRead.NoTown -> null
}
