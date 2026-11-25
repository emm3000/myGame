package com.emm.mygame.core.ui

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier

@Composable
fun FoldedTaskEnd(hook: TaskDockHook, shownNotice: Any?, modifier: Modifier = Modifier) {
    val dock: TaskDock = hook.dock?.takeIf { hook.isFolded } ?: return
    NoticeInView(shownNotice = shownNotice, modifier = modifier) {
        dock.notice()
    }
}
