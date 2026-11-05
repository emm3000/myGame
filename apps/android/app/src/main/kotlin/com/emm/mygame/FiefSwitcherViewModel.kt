package com.emm.mygame

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.network.FiefId
import com.emm.mygame.core.network.FiefListRepository
import com.emm.mygame.core.network.FiefListResult
import com.emm.mygame.core.network.FreeSlot
import com.emm.mygame.core.network.ListedFief
import com.emm.mygame.core.network.ResourceKind
import kotlin.time.Duration
import kotlin.time.Duration.Companion.seconds
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

private val listingRetryDelay: Duration = 30.seconds

internal class FiefSwitcherViewModel(
    private val current: FiefId?,
    private val listings: FiefListRepository,
) : ViewModel() {

    private val _state: MutableStateFlow<FiefSwitcherUiState> = MutableStateFlow(FiefSwitcherUiState.Unlisted)

    val state: StateFlow<FiefSwitcherUiState> = _state.asStateFlow()

    private var reading: Job? = null

    fun onIntent(intent: FiefSwitcherIntent) {
        when (intent) {
            FiefSwitcherIntent.ScreenShown -> read()
        }
    }

    private fun read() {
        reading?.cancel()
        reading = viewModelScope.launch {
            while (true) {
                when (val answer: FiefListResult = listings.listed()) {
                    is FiefListResult.Listed -> {
                        _state.value = FiefSwitcherUiState.Listed(answer.fiefs.map { fief: ListedFief -> fief.entry() })
                        return@launch
                    }
                    FiefListResult.Unreachable -> delay(listingRetryDelay)
                }
            }
        }
    }

    private fun ListedFief.entry(): FiefSwitcherUiState.Entry {
        val isCurrent: Boolean = id == current
        return FiefSwitcherUiState.Entry(
            fief = id,
            name = name,
            address = address,
            isCurrent = isCurrent,
            badges = if (isCurrent) emptyList() else badges(),
        )
    }
}

private fun ListedFief.badges(): List<FiefSwitcherUiState.Badge> =
    freeSlots.map { slot: FreeSlot -> FiefSwitcherUiState.Badge.Idle(slot) } +
        fullStores.map { resource: ResourceKind -> FiefSwitcherUiState.Badge.FullStore(resource) }
