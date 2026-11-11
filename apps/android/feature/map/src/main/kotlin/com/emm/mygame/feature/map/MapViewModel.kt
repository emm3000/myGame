package com.emm.mygame.feature.map

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.network.HeldTown
import com.emm.mygame.core.network.JobTarget
import com.emm.mygame.core.network.RegionMap
import com.emm.mygame.core.network.RegionMapResult
import com.emm.mygame.core.network.TownHireKind
import com.emm.mygame.core.network.TownJobResult
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownRepository
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.projection.countdownTo
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

class MapViewModel(private val towns: TownRepository, private val clock: Clock) : ViewModel() {

    private val _state: MutableStateFlow<MapUiState> = MutableStateFlow(MapUiState.Loading)

    val state: StateFlow<MapUiState> = _state.asStateFlow()

    private val _effects: Channel<MapEffect> = Channel(Channel.BUFFERED)

    val effects: Flow<MapEffect> = _effects.receiveAsFlow()

    private var projection: Job? = null

    private var areaRead: Job? = null

    private var asked: Int? = null

    private var area: AreaRead = AreaRead.Reading

    private var shown: TownSnapshot? = null

    private var isTownFailed: Boolean = false

    private var choices: MapChoices = MapChoices.none

    private var gap: Duration = Duration.ZERO

    private var isShown: Boolean = true

    private var quoteAsked: QuoteAsk? = null

    private var quoted: MapUiState.PayQuote? = null

    private var quoteRead: Job? = null

    init {
        readArea(null)
        openTown()
    }

    fun onIntent(intent: MapIntent) {
        when (intent) {
            MapIntent.ScreenShown -> show()
            MapIntent.ScreenHidden -> hide()
            MapIntent.RetryTapped -> retry()
            is MapIntent.AreaTapped -> readArea(intent.area)
            MapIntent.OwnAreaTapped -> readArea(null)
            is MapIntent.SendTeamTapped -> drawChoices(choices.choosing(intent.site))
            is MapIntent.JobEntryChanged ->
                drawChoices(choices.copy(entries = choices.entries.with(intent.field, intent.entry)))
            MapIntent.SendTapped -> send()
            MapIntent.CallBackTapped -> callBack()
        }
    }

    private fun show() {
        if (isShown) return
        isShown = true
        val last: TownSnapshot = shown ?: return
        projection = viewModelScope.launch { project(last, firstReadAt = serverNow()) }
    }

    private fun hide() {
        isShown = false
        projection?.cancel()
    }

    private fun retry() {
        if (_state.value != MapUiState.Failed) return
        if (area == AreaRead.Failed) readArea(asked)
        if (isTownFailed) openTown()
    }

    private fun readArea(chosenArea: Int?) {
        asked = chosenArea
        area = AreaRead.Reading
        drawChoices(choices.closed())
        areaRead?.cancel()
        areaRead = viewModelScope.launch {
            area = when (val answer: RegionMapResult = towns.readMap(chosenArea)) {
                is RegionMapResult.Read -> AreaRead.Read(answer.map)
                RegionMapResult.AreaNotFound -> AreaRead.NotFound
                RegionMapResult.NoTown -> return@launch _effects.send(MapEffect.NoTown)
                RegionMapResult.Unreachable -> AreaRead.Failed
            }
            draw()
        }
    }

    private fun openTown() {
        val held: HeldTown? = towns.town.value
        if (held != null) {
            gap = held.gap
            return restartFrom(held.town, choices)
        }
        isTownFailed = false
        draw()
        viewModelScope.launch {
            when (val answer: TownReadResult = towns.read()) {
                is TownReadResult.Read -> restartFrom(measured(answer.town), choices)
                TownReadResult.NoTown -> _effects.send(MapEffect.NoTown)
                TownReadResult.Unreachable -> {
                    isTownFailed = true
                    draw()
                }
            }
        }
    }

    private fun send() {
        if (choices.send == MapUiState.SendRequest.Waiting) return
        val site: Int = choices.chosen ?: return
        val map: RegionMap = (area as? AreaRead.Read)?.map ?: return
        val team: Map<TownHireKind, Int> = choices.entries.team() ?: return
        val hours: Int = choices.entries.hoursCount() ?: return
        drawChoices(choices.copy(send = MapUiState.SendRequest.Waiting))
        viewModelScope.launch {
            when (val answer: TownJobResult = towns.sendJob(JobTarget(map.area, site), team, hours)) {
                is TownJobResult.Answered ->
                    restartFrom(answer.town, choices.closed().copy(send = MapUiState.SendRequest.Idle))
                is TownJobResult.Refused ->
                    drawChoices(choices.copy(send = MapUiState.SendRequest.Refused(site, answer.refusal)))
                TownJobResult.Unreachable ->
                    drawChoices(choices.copy(send = MapUiState.SendRequest.Unreachable(site)))
            }
        }
    }

    private fun callBack() {
        if (choices.callBack == MapUiState.CallBackRequest.Waiting) return
        val job: TownSnapshot.Job = shown?.job ?: return
        drawChoices(choices.copy(callBack = MapUiState.CallBackRequest.Waiting))
        viewModelScope.launch {
            when (val answer: TownJobResult = towns.callJobBack(job.sentAt)) {
                is TownJobResult.Answered ->
                    restartFrom(answer.town, choices.copy(callBack = MapUiState.CallBackRequest.Idle))
                is TownJobResult.Refused ->
                    drawChoices(choices.copy(callBack = MapUiState.CallBackRequest.Refused(answer.refusal)))
                TownJobResult.Unreachable ->
                    drawChoices(choices.copy(callBack = MapUiState.CallBackRequest.Unreachable))
            }
        }
    }

    private fun restartFrom(town: TownSnapshot, kept: MapChoices) {
        projection?.cancel()
        choices = kept
        shown = town
        draw()
        if (isShown) {
            projection = viewModelScope.launch { project(town, firstReadAt = town.readInstants().minOrNull()) }
        }
    }

    private fun drawChoices(next: MapChoices) {
        choices = next
        draw()
    }

    private fun draw() {
        askQuote()
        _state.value = stateOf(area, shown)
    }

    private fun askQuote() {
        val ask: QuoteAsk? = currentQuoteAsk()
        if (ask == quoteAsked) return
        quoteAsked = ask
        quoted = null
        quoteRead?.cancel()
        if (ask == null) return
        quoteRead = viewModelScope.launch {
            quoted = payQuoteOf(towns.quoteJob(ask.target, ask.team, ask.hours))
            draw()
        }
    }

    private fun currentQuoteAsk(): QuoteAsk? {
        val map: RegionMap = (area as? AreaRead.Read)?.map ?: return null
        val town: TownSnapshot = shown ?: return null
        return quoteAskOf(map, town, choices)
    }

    private fun drawnQuote(): MapUiState.PayQuote? =
        if (quoteAsked == null) null else quoted ?: MapUiState.PayQuote.Asking

    private fun stateOf(read: AreaRead, town: TownSnapshot?): MapUiState {
        if (isTownFailed) return MapUiState.Failed
        return when (read) {
            AreaRead.Failed -> MapUiState.Failed
            AreaRead.NotFound -> MapUiState.AreaNotFound
            AreaRead.Reading -> MapUiState.Loading
            is AreaRead.Read ->
                town?.let { held: TownSnapshot ->
                    mapContentOf(read.map, held, serverNow(), gap, choices, drawnQuote())
                } ?: MapUiState.Loading
        }
    }

    private suspend fun project(first: TownSnapshot, firstReadAt: Instant?) {
        var town: TownSnapshot = first
        var nextReadAt: Instant? = firstReadAt
        while (true) {
            draw()
            if (nextReadAt != null && nextReadAt <= serverNow()) {
                when (val answer: TownReadResult = towns.read()) {
                    is TownReadResult.Read -> {
                        town = measured(answer.town)
                        shown = town
                        choices = choices.keptAfterRead()
                        nextReadAt = town.readInstantsAfter(serverNow()).minOrNull()
                        continue
                    }
                    TownReadResult.NoTown -> return _effects.send(MapEffect.NoTown)
                    TownReadResult.Unreachable -> nextReadAt = serverNow() + failedReadRetry
                }
            }
            delay(nextWakeFrom(town, nextReadAt))
        }
    }

    private fun nextWakeFrom(town: TownSnapshot, nextReadAt: Instant?): Duration {
        val now: Instant = serverNow()
        val remaining: Duration? = town.job?.let { job: TownSnapshot.Job -> countdownTo(job.nextInstant(), now) }
        val repaint: Duration = repaintDelay(remaining)
        return if (nextReadAt == null) repaint else minOf(repaint, nextReadAt - now)
    }

    private fun serverNow(): Instant = clock.now() + gap

    private fun measured(read: TownSnapshot): TownSnapshot {
        gap = read.readAt - clock.now()
        return read
    }
}

private sealed interface AreaRead {

    data object Reading : AreaRead

    data class Read(val map: RegionMap) : AreaRead

    data object NotFound : AreaRead

    data object Failed : AreaRead
}
