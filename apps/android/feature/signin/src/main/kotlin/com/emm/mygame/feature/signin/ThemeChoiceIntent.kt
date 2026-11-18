package com.emm.mygame.feature.signin

import com.emm.mygame.core.network.ThemePick

sealed interface ThemeChoiceIntent {

    data class Picked(val pick: ThemePick) : ThemeChoiceIntent
}
