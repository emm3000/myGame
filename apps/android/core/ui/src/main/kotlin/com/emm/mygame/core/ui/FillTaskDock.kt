package com.emm.mygame.core.ui

import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.SideEffect

@Composable
fun FillTaskDock(hook: TaskDockHook, dock: TaskDock) {
    SideEffect { hook.fill(dock) }
    DisposableEffect(hook) {
        onDispose { hook.fill(null) }
    }
}
