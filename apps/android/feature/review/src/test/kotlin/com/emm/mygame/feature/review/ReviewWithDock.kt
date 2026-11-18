package com.emm.mygame.feature.review

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import com.emm.mygame.core.designsystem.MyGameDock
import com.emm.mygame.core.ui.TaskDock
import com.emm.mygame.core.ui.TaskDockHook

internal const val TASK_DOCK: String = "task_dock"

@Composable
internal fun ReviewWithDock(
    state: ReviewUiState,
    onIntent: (ReviewIntent) -> Unit = {},
    hook: TaskDockHook = remember { TaskDockHook(onAnswered = {}) },
) {
    Column(modifier = Modifier.fillMaxSize()) {
        Box(modifier = Modifier.weight(1f)) {
            ReviewScreen(state = state, onIntent = onIntent, task = hook, foldedDock = {})
        }
        hook.dock?.let { shown: TaskDock ->
            MyGameDock(
                line = shown.line,
                go = shown.go,
                onFoldChange = hook::fold,
                modifier = Modifier.testTag(TASK_DOCK),
                notice = shown.notice,
            )
        }
    }
}
