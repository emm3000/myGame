package com.emm.mygame.feature.today

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.report.ReportRepository
import com.emm.mygame.core.model.town.HeldTown
import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.model.town.TownRepository
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.building.TownWorkResult
import com.emm.mygame.core.model.town.school.TownLessonResult
import com.emm.mygame.core.model.town.serverNow
import com.emm.mygame.core.projection.repaintDelay
import com.emm.mygame.core.projection.town.building.BlockReason
import com.emm.mygame.core.projection.town.building.StartStatus
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

class TodayViewModel(
    private val towns: TownRepository,
    private val reports: ReportRepository,
    private val clock: Clock,
) : ViewModel() {

    private val _state: MutableStateFlow<TodayUiState> = MutableStateFlow(TodayUiState.Loading)

    val state: StateFlow<TodayUiState> = _state.asStateFlow()

    private val _effects: Channel<TodayEffect> = Channel(Channel.BUFFERED)

    val effects: Flow<TodayEffect> = _effects.receiveAsFlow()

    private val news: TodayNews = TodayNews(reports, viewModelScope, clock, ::draw)

    private var held: HeldTown? = null

    private var requests: TodayRequests = TodayRequests()

    private var visit: TodayVisit = TodayVisit()

    private var reading: Job? = null

    private var following: Job? = null

    init {
        viewModelScope.launch { towns.town.collect(::hold) }
    }

    fun onIntent(intent: TodayIntent) {
        when (intent) {
            TodayIntent.ScreenShown -> show()
            TodayIntent.ScreenHidden -> hide()
            TodayIntent.ScreenLeft -> leave()
            TodayIntent.RetryTapped -> if (_state.value == TodayUiState.Failed) read()
            is TodayIntent.StudyTapped -> study(intent.lesson)
            is TodayIntent.BuildTapped -> build(intent.building)
            TodayIntent.NewsCloseTapped -> news.close()
        }
    }

    private fun show() {
        visit = visit.copy(isShown = true)
        read()
        news.read()
        follow()
    }

    private fun hide() {
        visit = visit.copy(isShown = false)
        following?.cancel()
    }

    private fun leave() {
        visit = visit.copy(away = null)
        draw()
    }

    private fun read() {
        if (reading?.isActive == true) return
        if (held == null) _state.value = TodayUiState.Loading
        reading = viewModelScope.launch {
            when (readTown()) {
                is TownReadResult.Read -> Unit
                TownReadResult.NoTown -> _effects.send(TodayEffect.NoTown)
                TownReadResult.Unreachable -> if (held == null) _state.value = TodayUiState.Failed
            }
        }
    }

    private suspend fun readTown(): TownReadResult {
        val answer: TownReadResult = towns.read()
        val gone: TownSnapshot.Away = (answer as? TownReadResult.Read)?.town?.away ?: return answer
        visit = visit.copy(away = gone)
        draw()
        return answer
    }

    private fun study(lesson: LessonId) {
        if (held == null || requests.lesson == TodayUiState.LessonStart.Starting) return
        requests = requests.copy(lesson = TodayUiState.LessonStart.Starting)
        draw()
        viewModelScope.launch {
            val answered: TodayUiState.LessonStart = when (val answer: TownLessonResult = towns.startLesson(lesson)) {
                is TownLessonResult.Answered -> TodayUiState.LessonStart.Idle
                is TownLessonResult.Refused -> TodayUiState.LessonStart.Refused(answer.refusal)
                TownLessonResult.Unreachable -> TodayUiState.LessonStart.Unreachable
            }
            requests = requests.copy(lesson = answered)
            draw()
        }
    }

    private fun build(building: TownBuildingKind) {
        if (held == null || requests.build is StartStatus.Waiting) return
        requests = requests.copy(build = StartStatus.Waiting(building))
        draw()
        viewModelScope.launch {
            val answered: StartStatus = when (val answer: TownWorkResult = towns.startWork(building)) {
                is TownWorkResult.Answered -> StartStatus.Idle
                is TownWorkResult.Refused -> StartStatus.Refused(building, answer.refusal)
                TownWorkResult.Unreachable -> StartStatus.Unreachable(building)
            }
            requests = requests.copy(build = answered)
            draw()
        }
    }

    private fun hold(next: HeldTown?) {
        held = next
        requests = TodayRequests(
            lesson = if (requests.lesson == TodayUiState.LessonStart.Starting) {
                TodayUiState.LessonStart.Starting
            } else {
                TodayUiState.LessonStart.Idle
            },
            build = requests.build.takeIf { build: StartStatus -> build is StartStatus.Waiting } ?: StartStatus.Idle,
        )
        draw()
        follow()
    }

    private fun follow() {
        following?.cancel()
        if (!visit.isShown || held == null) return
        following = viewModelScope.launch {
            while (true) {
                val town: TownSnapshot = held?.town ?: return@launch
                val now: Instant = now()
                val countdown: Instant? = town.countdownsAt().minOrNull()
                if (countdown != null && countdown <= now) {
                    news.read()
                    readTown()
                    return@launch
                }
                val left: Duration =
                    listOfNotNull(countdown?.minus(now), nearestReadyLeft()).minOrNull() ?: return@launch
                delay(repaintDelay(left))
                draw()
            }
        }
    }

    private fun nearestReadyLeft(): Duration? = (_state.value as? TodayUiState.Content)?.locked
        ?.mapNotNull { row: TodayUiState.Locked -> (row.block as? BlockReason.Resources)?.ready?.remaining }
        ?.filter { left: Duration -> left > Duration.ZERO }
        ?.minOrNull()

    private fun draw() {
        val shown: HeldTown = held ?: return
        val gained: List<TownSnapshot.Cost> = visit.away?.gained.orEmpty()
        _state.value = shown.town.todayAt(now(), shown.gap, requests, gained, news.whatHappened)
    }

    private fun now(): Instant = serverNow(clock, held?.gap ?: Duration.ZERO)
}
