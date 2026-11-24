package com.emm.mygame.core.testing

import com.emm.mygame.core.model.theme.ThemePick
import com.emm.mygame.core.model.theme.ThemeSettings
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class FakeThemeSettings(first: ThemePick) : ThemeSettings {

    private val _pick: MutableStateFlow<ThemePick> = MutableStateFlow(first)

    override val pick: StateFlow<ThemePick> = _pick.asStateFlow()

    override fun choose(pick: ThemePick) {
        _pick.value = pick
    }
}
