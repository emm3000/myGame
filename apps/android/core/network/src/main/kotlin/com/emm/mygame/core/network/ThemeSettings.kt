package com.emm.mygame.core.network

import kotlinx.coroutines.flow.StateFlow

interface ThemeSettings {

    val pick: StateFlow<ThemePick>

    fun choose(pick: ThemePick)
}
