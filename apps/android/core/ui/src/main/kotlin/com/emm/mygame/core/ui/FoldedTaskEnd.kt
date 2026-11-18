package com.emm.mygame.core.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.relocation.BringIntoViewRequester
import androidx.compose.foundation.relocation.bringIntoViewRequester
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.MyGameDockLineText
import com.emm.mygame.core.designsystem.MyGameSpacing

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
    val requester: BringIntoViewRequester = remember { BringIntoViewRequester() }
    val lastNotice: MutableState<Any?> = remember { mutableStateOf(shownNotice) }
    LaunchedEffect(shownNotice) {
        val isNewNotice: Boolean = shownNotice != null && shownNotice != lastNotice.value
        lastNotice.value = shownNotice
        if (isNewNotice) requester.bringIntoView()
    }
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
        modifier = modifier.bringIntoViewRequester(requester),
    ) {
        MyGameDockLineText(line = dock.line, loadingLabel = dock.go.busyDescription)
        dock.notice()
    }
}
