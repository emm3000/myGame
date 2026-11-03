package com.emm.mygame.feature.map

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.network.FiefReadResult
import com.emm.mygame.core.network.FiefRepository
import com.emm.mygame.core.network.FiefSnapshot
import com.emm.mygame.core.network.MapPlot
import com.emm.mygame.core.network.MapReadResult
import com.emm.mygame.core.network.MapRepository
import com.emm.mygame.core.network.MarchResult
import com.emm.mygame.core.network.PlotAddress
import com.emm.mygame.core.network.PlotHolder
import com.emm.mygame.core.network.ProvinceMap
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class MapViewModel(private val maps: MapRepository, private val fiefs: FiefRepository) : ViewModel() {

    private val _state: MutableStateFlow<MapUiState> = MutableStateFlow(MapUiState.Loading)

    val state: StateFlow<MapUiState> = _state.asStateFlow()

    private var fief: FiefSnapshot? = null

    private var isFiefRead: Boolean = false

    private var choice: ForageChoice? = null

    private var sent: MapUiState.SentForage? = null

    init {
        read(ProvinceRequest.Own)
    }

    fun onIntent(intent: MapIntent) {
        when (intent) {
            MapIntent.RetryTapped -> retry()
            MapIntent.PreviousTapped -> browse { content: MapUiState.Content ->
                if (content.hasPrevious) content.map.province - 1 else null
            }
            MapIntent.NextTapped -> browse { content: MapUiState.Content ->
                if (content.hasNext) content.map.province + 1 else null
            }
            is MapIntent.JumpEntryChanged -> changeJumpEntry(intent.entry)
            MapIntent.JumpTapped -> browse { content: MapUiState.Content ->
                content.jumpEntry.toIntOrNull()?.takeIf { it >= 1 }
            }
            MapIntent.OwnProvinceTapped -> readOwnAgain()
            is MapIntent.ForageToggled -> toggle(intent.plot)
            is MapIntent.PartyEntryChanged -> choose { open: ForageChoice ->
                open.copy(entries = open.entries + (intent.unit to intent.entry))
            }
            is MapIntent.HoursEntryChanged -> choose { open: ForageChoice -> open.copy(hoursEntry = intent.entry) }
            MapIntent.SendTapped -> send()
        }
    }

    private fun retry() {
        val failed: MapUiState.Failed = _state.value as? MapUiState.Failed ?: return
        read(failed.request)
    }

    private fun browse(targetOf: (MapUiState.Content) -> Int?) {
        val content: MapUiState.Content = _state.value as? MapUiState.Content ?: return
        val target: Int = targetOf(content) ?: return
        read(ProvinceRequest.Numbered(target))
    }

    private fun changeJumpEntry(entry: String) {
        val content: MapUiState.Content = _state.value as? MapUiState.Content ?: return
        _state.value = content.copy(jumpEntry = entry)
    }

    private fun readOwnAgain() {
        if (_state.value == MapUiState.ProvinceNotFound) read(ProvinceRequest.Own)
    }

    private fun toggle(plot: Int) {
        val content: MapUiState.Content = _state.value as? MapUiState.Content ?: return
        val read: FiefSnapshot = fief ?: return
        if (plot !in content.forageablePlots) return
        val target: PlotAddress = PlotAddress(province = content.map.province, plot = plot)
        sent = null
        choice = if (choice?.target == target) null else read.firstChoiceOn(target)
        redraw()
    }

    private fun choose(change: (ForageChoice) -> ForageChoice) {
        val open: ForageChoice = choice ?: return
        choice = change(open)
        redraw()
    }

    private fun send() {
        val read: FiefSnapshot = fief ?: return
        val open: ForageChoice = choice?.takeIf { asked: ForageChoice -> asked.send != MapUiState.SendStatus.Waiting }
            ?: return
        val request: ForageRequest = requestOf(open) ?: return
        answerSend(open, MapUiState.SendStatus.Waiting)
        viewModelScope.launch {
            when (val answer: MarchResult = fiefs.forage(read.id, open.target, request.party, request.stayHours)) {
                is MarchResult.Answered -> {
                    fief = answer.fief
                    choice = null
                    sent = answer.fief.sentForage()
                    redraw()
                }
                is MarchResult.Refused -> answerSend(open, MapUiState.SendStatus.Refused(answer.refusal))
                MarchResult.Unreachable -> answerSend(open, MapUiState.SendStatus.Unreachable)
            }
        }
    }

    private fun answerSend(asked: ForageChoice, status: MapUiState.SendStatus) {
        val open: ForageChoice = choice ?: return
        if (open.target != asked.target) return
        choice = open.copy(send = status)
        redraw()
    }

    private fun read(request: ProvinceRequest) {
        _state.value = MapUiState.Loading
        choice = null
        sent = null
        if (!isFiefRead) readFief()
        viewModelScope.launch {
            val answer: MapReadResult = when (request) {
                ProvinceRequest.Own -> maps.readOwn()
                is ProvinceRequest.Numbered -> maps.read(request.province)
            }
            _state.value = when (answer) {
                is MapReadResult.Read -> contentOf(answer.map, jumpEntry = answer.map.province.toString())
                MapReadResult.ProvinceNotFound -> MapUiState.ProvinceNotFound
                MapReadResult.Unreachable -> MapUiState.Failed(request)
            }
        }
    }

    private fun readFief() {
        isFiefRead = true
        viewModelScope.launch {
            when (val answer: FiefReadResult = fiefs.read()) {
                is FiefReadResult.Read -> {
                    fief = answer.fief
                    redraw()
                }
                FiefReadResult.Unreachable -> isFiefRead = false
            }
        }
    }

    private fun redraw() {
        val content: MapUiState.Content = _state.value as? MapUiState.Content ?: return
        _state.value = contentOf(content.map, content.jumpEntry)
    }

    private fun contentOf(map: ProvinceMap, jumpEntry: String): MapUiState.Content {
        val read: FiefSnapshot? = fief
        return MapUiState.Content(
            map = map,
            jumpEntry = jumpEntry,
            forageablePlots = if (read == null) emptyList() else map.freePlots(),
            form = choice?.let { open: ForageChoice -> read?.formOf(open, map.terrain) },
            sent = sent,
        )
    }

    private fun ProvinceMap.freePlots(): List<Int> =
        plots.filter { plot: MapPlot -> plot.holder == PlotHolder.Free }.map { plot: MapPlot -> plot.plot }
}
