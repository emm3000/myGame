package com.emm.mygame.feature.jobs

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.model.town.HeldTown
import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.model.town.TownRepository
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.jobs.RegionMap
import com.emm.mygame.core.model.town.jobs.RegionMapResult
import com.emm.mygame.core.model.town.jobs.TownJobResult
import com.emm.mygame.core.projection.countdownTo
import com.emm.mygame.core.projection.repaintDelay
import kotlin.time.Clock
import kotlin.time.Duration
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
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

private val unreachableQuoteRetry: Duration = 5.seconds

class MapViewModel(private val towns: TownRepository, private val clock: Clock) : ViewModel() {

    private val _state: MutableStateFlow<MapUiState> = MutableStateFlow(MapUiState.Loading)

    val state: StateFlow<MapUiState> = _state.asStateFlow()

    private val _effects: Channel<MapEffect> = Channel(Channel.BUFFERED)

    val effects: Flow<MapEffect> = _effects.receiveAsFlow()

    private var reads: MapReads = MapReads.none

    private var server: MapServerView = MapServerView.none

    private var choices: MapChoices = MapChoices.none

    private var quote: MapQuote = MapQuote.none

    private var isShown: Boolean = true

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
            is MapIntent.JobEntryChanged -> drawChoices(choices.entering(intent.field, intent.entry))
            MapIntent.SendTapped -> send()
            MapIntent.CallBackTapped -> callBack()
        }
    }

    private fun show() {
        if (isShown) return
        isShown = true
        quote = MapQuote.none
        val last: TownSnapshot = server.town ?: return
        val projection: Job = viewModelScope.launch { project(last, firstReadAt = serverNow()) }
        reads = reads.copy(projection = projection)
    }

    private fun hide() {
        isShown = false
        reads.projection?.cancel()
        reads.quoteReading?.cancel()
    }

    private fun retry() {
        if (_state.value != MapUiState.Failed) return
        if (server.area == AreaRead.Failed) readArea(server.askedArea)
        if (server.isTownFailed) openTown()
    }

    private fun readArea(chosenArea: Int?) {
        server = server.copy(askedArea = chosenArea, area = AreaRead.Reading)
        drawChoices(choices.closed())
        reads.areaReading?.cancel()
        val areaReading: Job = viewModelScope.launch {
            val area: AreaRead = when (val answer: RegionMapResult = towns.readMap(chosenArea)) {
                is RegionMapResult.Read -> AreaRead.Read(answer.map)
                RegionMapResult.AreaNotFound -> AreaRead.NotFound
                RegionMapResult.NoTown -> return@launch _effects.send(MapEffect.NoTown)
                RegionMapResult.Unreachable -> AreaRead.Failed
            }
            server = server.copy(area = area)
            draw()
        }
        reads = reads.copy(areaReading = areaReading)
    }

    private fun openTown() {
        val held: HeldTown? = towns.town.value
        if (held != null) {
            server = server.copy(gap = held.gap)
            return restartFrom(held.town, choices)
        }
        server = server.copy(isTownFailed = false)
        draw()
        viewModelScope.launch {
            when (val answer: TownReadResult = towns.read()) {
                is TownReadResult.Read -> restartFrom(measured(answer.town), choices)
                TownReadResult.NoTown -> _effects.send(MapEffect.NoTown)
                TownReadResult.Unreachable -> {
                    server = server.copy(isTownFailed = true)
                    draw()
                }
            }
        }
    }

    private fun send() {
        if (choices.send == MapUiState.SendRequest.Waiting) return
        val site: Int = choices.chosen ?: return
        val map: RegionMap = server.map ?: return
        val request: SiteSend = siteSendOf(map, site, choices.entries) ?: return
        drawChoices(choices.copy(send = MapUiState.SendRequest.Waiting))
        viewModelScope.launch {
            when (val answer: TownJobResult = towns.sent(request)) {
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
        val job: TownSnapshot.Job = server.town?.job ?: return
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
        reads.projection?.cancel()
        choices = kept
        server = server.copy(town = town)
        draw()
        if (!isShown) return
        val projection: Job = viewModelScope.launch { project(town, firstReadAt = town.readInstants().minOrNull()) }
        reads = reads.copy(projection = projection)
    }

    private fun drawChoices(next: MapChoices) {
        choices = next
        draw()
    }

    private fun draw() {
        askQuote()
        _state.value = currentState()
    }

    private fun askQuote() {
        val ask: QuoteAsk? = server.quoteAsk(choices)
        if (ask == quote.ask) return
        quote = MapQuote(ask, answer = null)
        reads.quoteReading?.cancel()
        if (ask == null) return
        val quoteReading: Job = viewModelScope.launch {
            do {
                val answer: QuoteAnswer = towns.quoted(ask.send)
                quote = quote.copy(answer = answer)
                draw()
                if (answer.isUnreachable) delay(unreachableQuoteRetry)
            } while (answer.isUnreachable)
        }
        reads = reads.copy(quoteReading = quoteReading)
    }

    private fun currentState(): MapUiState {
        if (server.isTownFailed) return MapUiState.Failed
        return when (val read: AreaRead = server.area) {
            AreaRead.Failed -> MapUiState.Failed
            AreaRead.NotFound -> MapUiState.AreaNotFound
            AreaRead.Reading -> MapUiState.Loading
            is AreaRead.Read ->
                server.town?.let { held: TownSnapshot ->
                    mapContentOf(read.map, held, serverNow(), server.gap, choices, quote.drawn())
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
                        server = server.copy(town = town)
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

    private fun serverNow(): Instant = clock.now() + server.gap

    private fun measured(read: TownSnapshot): TownSnapshot {
        server = server.copy(gap = read.readAt - clock.now())
        return read
    }
}
