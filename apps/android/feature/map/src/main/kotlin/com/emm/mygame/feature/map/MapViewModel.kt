package com.emm.mygame.feature.map

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.network.FiefReadResult
import com.emm.mygame.core.network.FiefRepository
import com.emm.mygame.core.network.FiefSnapshot
import com.emm.mygame.core.network.MapPlot
import com.emm.mygame.core.network.MapReadResult
import com.emm.mygame.core.network.MapRepository
import com.emm.mygame.core.network.MarchDispatch
import com.emm.mygame.core.network.MarchResult
import com.emm.mygame.core.network.PlotAddress
import com.emm.mygame.core.network.PlotHolder
import com.emm.mygame.core.network.ProvinceMap
import com.emm.mygame.core.network.UnitCount
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class MapViewModel(private val maps: MapRepository, private val fiefs: FiefRepository) : ViewModel() {

    private val _state: MutableStateFlow<MapUiState> = MutableStateFlow(MapUiState.Loading)

    val state: StateFlow<MapUiState> = _state.asStateFlow()

    private var fief: FiefSnapshot? = null

    private var isFiefRead: Boolean = false

    private var choice: MarchChoice? = null

    private var sent: MapUiState.SentMarch? = null

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
            is MapIntent.ForageToggled -> toggle(intent.plot, MapUiState.OfferedOrder.Forage, proposedName = "")
            is MapIntent.AttackToggled -> toggle(intent.plot, MapUiState.OfferedOrder.Attack, proposedName = "")
            is MapIntent.FoundingToggled -> toggle(intent.plot, MapUiState.OfferedOrder.Found, intent.proposedName)
            is MapIntent.TransportToggled -> toggle(intent.plot, MapUiState.OfferedOrder.Transport, proposedName = "")
            is MapIntent.PartyEntryChanged -> choose { open: MarchChoice ->
                open.copy(entries = open.entries + (intent.unit to intent.entry))
            }
            is MapIntent.HoursEntryChanged -> choose { open: MarchChoice -> open.copy(hoursEntry = intent.entry) }
            is MapIntent.NameEntryChanged -> choose { open: MarchChoice -> open.copy(nameEntry = intent.entry) }
            is MapIntent.CargoEntryChanged -> choose { open: MarchChoice ->
                open.copy(cargoEntries = open.cargoEntries + (intent.kind to intent.entry))
            }
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

    private fun toggle(plot: Int, offered: MapUiState.OfferedOrder, proposedName: String) {
        val content: MapUiState.Content = _state.value as? MapUiState.Content ?: return
        val read: FiefSnapshot = fief ?: return
        val order: ChosenOrder = content.offeredOrderOn(plot, offered) ?: return
        val target: PlotAddress = PlotAddress(province = content.map.province, plot = plot)
        sent = null
        val isOpen: Boolean = choice?.let { open: MarchChoice -> open.target == target && open.order == order } ?: false
        choice = if (isOpen) null else read.firstChoiceOn(target, order, proposedName)
        redraw()
    }

    private fun choose(change: (MarchChoice) -> MarchChoice) {
        val open: MarchChoice = choice ?: return
        choice = change(open)
        redraw()
    }

    private fun send() {
        val read: FiefSnapshot = fief ?: return
        val open: MarchChoice = choice?.takeIf { asked: MarchChoice -> asked.send != MapUiState.SendStatus.Waiting }
            ?: return
        val march: MarchDispatch = dispatchOf(open) ?: return
        answerSend(open, MapUiState.SendStatus.Waiting)
        viewModelScope.launch {
            when (val answer: MarchResult = fiefs.dispatch(read.id, march)) {
                is MarchResult.Answered -> {
                    fief = answer.fief
                    choice = null
                    sent = answer.fief.sentMarch()
                    redraw()
                }
                is MarchResult.Refused -> answerSend(open, read.refusedStatusOf(open, answer.refusal))
                MarchResult.Unreachable -> answerSend(open, MapUiState.SendStatus.Unreachable)
            }
        }
    }

    private fun dispatchOf(open: MarchChoice): MarchDispatch? = when (val order: ChosenOrder = open.order) {
        ChosenOrder.Forage -> forageRequestOf(open)?.let { request: ForageRequest ->
            MarchDispatch.Forage(open.target, request.party, request.stayHours)
        }
        is ChosenOrder.Attack -> attackPartyOf(open)?.let { party: List<UnitCount> ->
            MarchDispatch.Attack(open.target, party)
        }
        ChosenOrder.Found -> MarchDispatch.Found(open.target, foundingNameOf(open))
        is ChosenOrder.Transport -> transportLoadOf(open)?.let { load: TransportLoad ->
            MarchDispatch.Transport(order.destination, load.party, load.cargo)
        }
    }

    private fun answerSend(asked: MarchChoice, status: MapUiState.SendStatus) {
        val open: MarchChoice = choice ?: return
        if (open.target != asked.target || open.order != asked.order) return
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
            offers = read?.offersOn(map).orEmpty(),
            form = choice?.let { open: MarchChoice -> read?.formOf(open, map.terrain) },
            sent = sent,
        )
    }
}

private fun MapUiState.Content.offeredOrderOn(plot: Int, offered: MapUiState.OfferedOrder): ChosenOrder? {
    if (MapUiState.PlotOffer(plot, offered) !in offers) return null
    val holder: PlotHolder = map.plots.firstOrNull { each: MapPlot -> each.plot == plot }?.holder ?: return null
    return chosenOrderOf(holder, offered)
}
