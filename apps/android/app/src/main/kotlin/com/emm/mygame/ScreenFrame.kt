package com.emm.mygame

import androidx.compose.runtime.Composable
import com.emm.mygame.core.ui.TaskDockHook

internal class ScreenFrame(val foldedDock: @Composable () -> Unit, val task: TaskDockHook) {

    val onAnswered: () -> Unit = task.onAnswered
}
