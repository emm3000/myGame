package com.emm.mygame.core.model.theme

import kotlinx.coroutines.flow.StateFlow

interface ThemeSettings {

    val pick: StateFlow<ThemePick>

    fun choose(pick: ThemePick)
}
