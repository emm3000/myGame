package com.emm.mygame

import android.content.SharedPreferences
import com.emm.mygame.core.network.ThemePick
import com.emm.mygame.core.network.ThemeSettings
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class ThemeStore(private val preferences: SharedPreferences) : ThemeSettings {

    private val _pick: MutableStateFlow<ThemePick> = MutableStateFlow(preferences.storedPick())

    override val pick: StateFlow<ThemePick> = _pick.asStateFlow()

    override fun choose(pick: ThemePick) {
        preferences.edit().putString(PICK, pick.name).apply()
        _pick.value = pick
    }
}

private const val PICK: String = "pick"

private fun SharedPreferences.storedPick(): ThemePick =
    ThemePick.entries.firstOrNull { pick: ThemePick -> pick.name == getString(PICK, null) } ?: ThemePick.System
