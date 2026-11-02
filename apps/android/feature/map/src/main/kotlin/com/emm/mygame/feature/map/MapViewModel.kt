package com.emm.mygame.feature.map

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.network.MapReadResult
import com.emm.mygame.core.network.MapRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class MapViewModel(private val maps: MapRepository) : ViewModel() {

    private val _state: MutableStateFlow<MapUiState> = MutableStateFlow(MapUiState.Loading)

    val state: StateFlow<MapUiState> = _state.asStateFlow()

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

    private fun read(request: ProvinceRequest) {
        _state.value = MapUiState.Loading
        viewModelScope.launch {
            val answer: MapReadResult = when (request) {
                ProvinceRequest.Own -> maps.readOwn()
                is ProvinceRequest.Numbered -> maps.read(request.province)
            }
            _state.value = when (answer) {
                is MapReadResult.Read ->
                    MapUiState.Content(map = answer.map, jumpEntry = answer.map.province.toString())
                MapReadResult.ProvinceNotFound -> MapUiState.ProvinceNotFound
                MapReadResult.Unreachable -> MapUiState.Failed(request)
            }
        }
    }
}
