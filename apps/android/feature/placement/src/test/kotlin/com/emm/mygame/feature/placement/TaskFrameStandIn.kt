package com.emm.mygame.feature.placement

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import com.emm.mygame.core.designsystem.INK_PILL
import com.emm.mygame.core.designsystem.MyGameDock
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.ui.TaskDock
import com.emm.mygame.core.ui.TaskDockHook

internal const val TASK_DOCK: String = "task_dock"

internal val inTaskDock: SemanticsMatcher = hasAnyAncestor(hasTestTag(TASK_DOCK))

internal fun dockGo(label: String): SemanticsMatcher =
    hasTestTag(INK_PILL).and(inTaskDock).and(hasContentDescription(label, substring = true))

internal fun hasCopy(line: String): SemanticsMatcher = hasText(line).or(hasContentDescription(line, substring = true))

@Composable
internal fun TaskFrameStandIn(hook: TaskDockHook, content: @Composable () -> Unit) {
    MyGameTheme {
        Column {
            Box(modifier = Modifier.weight(1f)) { content() }
            hook.dock?.let { shown: TaskDock ->
                MyGameDock(
                    line = shown.line,
                    go = shown.go,
                    onFoldChange = {},
                    modifier = Modifier.testTag(TASK_DOCK),
                    notice = shown.notice,
                )
            }
        }
    }
}
