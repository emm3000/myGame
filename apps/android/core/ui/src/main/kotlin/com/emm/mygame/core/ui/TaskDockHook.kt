package com.emm.mygame.core.ui

import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue

@Stable
class TaskDockHook(val onAnswered: () -> Unit) {

    var dock: TaskDock? by mutableStateOf(null)
        private set

    var isFolded: Boolean by mutableStateOf(false)
        private set

    fun fill(shown: TaskDock?) {
        dock = shown
    }

    fun fold(folded: Boolean) {
        isFolded = folded
    }
}
