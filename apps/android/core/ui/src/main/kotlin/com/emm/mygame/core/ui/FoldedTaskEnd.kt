package com.emm.mygame.core.ui

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier

@Composable
fun FoldedTaskEnd(
    hook: TaskDockHook,
    foldedDock: @Composable () -> Unit,
    shownNotice: Any?,
    modifier: Modifier = Modifier,
) {
    if (hook.town != null) {
        foldedDock()
        return
    }
    val dock: TaskDock = hook.dock?.takeIf { hook.isFolded } ?: return
    NoticeInView(shownNotice = shownNotice, modifier = modifier) {
        dock.notice()
    }
}
