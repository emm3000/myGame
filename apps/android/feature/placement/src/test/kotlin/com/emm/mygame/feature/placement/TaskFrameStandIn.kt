package com.emm.mygame.feature.placement

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.unit.DpRect
import com.emm.mygame.core.designsystem.INK_PILL
import com.emm.mygame.core.designsystem.MyGameDock
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.ui.TaskDock
import com.emm.mygame.core.ui.TaskDockHook
import org.junit.Assert.assertTrue

internal const val TASK_DOCK: String = "task_dock"

internal val inTaskDock: SemanticsMatcher = hasAnyAncestor(hasTestTag(TASK_DOCK))

internal fun dockGo(label: String): SemanticsMatcher =
    hasTestTag(INK_PILL).and(inTaskDock).and(hasContentDescription(label, substring = true))

internal fun assertAskingProgressDrawnOnce(composeRule: ComposeContentTestRule, band: String, position: String) {
    val bandLine: SemanticsMatcher = hasContentDescription(band).and(inTaskDock.not())
    val positionLine: SemanticsMatcher = hasText(position).and(inTaskDock.not())
    val track: SemanticsMatcher =
        SemanticsMatcher.keyIsDefined(SemanticsProperties.ProgressBarRangeInfo).and(inTaskDock.not())
    composeRule.onAllNodes(bandLine).assertCountEquals(1)
    composeRule.onAllNodes(positionLine).assertCountEquals(1)
    val bandBounds: DpRect = composeRule.onNode(bandLine).getUnclippedBoundsInRoot()
    val positionBounds: DpRect = composeRule.onNode(positionLine).getUnclippedBoundsInRoot()
    val trackBounds: DpRect = composeRule.onNode(track).getUnclippedBoundsInRoot()
    assertTrue(bandBounds.bottom <= positionBounds.top)
    assertTrue(positionBounds.bottom <= trackBounds.top)
}

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
