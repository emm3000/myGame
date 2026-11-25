package com.emm.mygame.core.ui

import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.SideEffect

@Composable
fun FollowTownDock(hook: TaskDockHook) {
    SideEffect { hook.follow(TownFollow) }
    DisposableEffect(hook) {
        onDispose { hook.follow(null) }
    }
}
