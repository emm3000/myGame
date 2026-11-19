package com.emm.mygame.feature.town

import androidx.compose.runtime.Composable

internal class TownPageTop(val foldedDock: @Composable () -> Unit, val reportRow: @Composable () -> Unit) {

    companion object {
        val none: TownPageTop = TownPageTop(foldedDock = {}, reportRow = {})
    }
}
