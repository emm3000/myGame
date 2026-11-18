package com.emm.mygame.feature.signin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.network.ThemePick
import com.emm.mygame.core.network.ThemeSettings
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class ThemeChoiceViewModel(private val themes: ThemeSettings) : ViewModel() {

    private val _state: MutableStateFlow<ThemeChoiceUiState> = MutableStateFlow(ThemeChoiceUiState(themes.pick.value))

    val state: StateFlow<ThemeChoiceUiState> = _state.asStateFlow()

    init {
        viewModelScope.launch { themes.pick.collect { pick: ThemePick -> _state.value = ThemeChoiceUiState(pick) } }
    }

    fun onIntent(intent: ThemeChoiceIntent) {
        when (intent) {
            is ThemeChoiceIntent.Picked -> themes.choose(intent.pick)
        }
    }
}
