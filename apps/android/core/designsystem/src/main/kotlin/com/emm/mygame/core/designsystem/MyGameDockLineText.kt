package com.emm.mygame.core.designsystem

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.Dp

private val stepStyle: TextStyle = MyGameTypography.heading

@Composable
fun MyGameDockLineText(line: MyGameDockLine, loadingLabel: String, modifier: Modifier = Modifier) {
    DockLineContent(line = line, loadingLabel = loadingLabel, isMeasureCopy = false, modifier = modifier)
}

@Composable
internal fun DockLineContent(
    line: MyGameDockLine,
    loadingLabel: String,
    isMeasureCopy: Boolean,
    modifier: Modifier = Modifier,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        MyGameMetaText(
            label = line.title,
            color = MyGameTheme.colors.inkMuted,
            modifier = Modifier.semantics { heading() },
        )
        DockStep(step = line.step, loadingLabel = loadingLabel, isMeasureCopy = isMeasureCopy)
    }
}

@Composable
private fun DockStep(step: MyGameLabel?, loadingLabel: String, isMeasureCopy: Boolean) {
    val isLive: Boolean = rememberHasStepChanged(step)
    if (step == null) {
        StepLoading(loadingLabel = loadingLabel, isMeasureCopy = isMeasureCopy)
        return
    }
    MyGameText(
        label = step,
        style = stepStyle,
        color = MyGameTheme.colors.ink,
        modifier = Modifier.semantics { if (isLive) liveRegion = LiveRegionMode.Polite },
    )
}

@Composable
private fun StepLoading(loadingLabel: String, isMeasureCopy: Boolean) {
    val height: Dp = lineHeightOf(stepStyle)
    if (isMeasureCopy) {
        Spacer(modifier = Modifier.height(height))
        return
    }
    MyGameSkeleton(
        isLoading = true,
        loadingLabel = loadingLabel,
        blocks = MyGameSkeletonBlocks(heights = listOf(height)),
        modifier = Modifier.heightIn(min = height),
    ) { }
}

@Composable
private fun rememberHasStepChanged(step: MyGameLabel?): Boolean {
    var firstStep: MyGameLabel? by remember { mutableStateOf(null) }
    var hasChanged: Boolean by remember { mutableStateOf(false) }
    val seen: MyGameLabel? = firstStep
    val isLive: Boolean = hasChanged || (seen != null && step != null && step != seen)
    SideEffect {
        if (firstStep == null) firstStep = step
        if (isLive) hasChanged = true
    }
    return isLive
}

@Composable
private fun lineHeightOf(style: TextStyle): Dp = with(LocalDensity.current) {
    (style.fontSize * style.lineHeight.value).toDp()
}

@PreviewMyGame
@Composable
private fun MyGameDockLineTextPreview() {
    MyGamePreviewSurface {
        MyGameDockLineText(
            line = MyGameDockLine(
                title = MyGameLabel(text = "What is next", translation = "Tu siguiente paso"),
                step = MyGameLabel(text = "Reviews due: 4", translation = "Repasos pendientes: 4"),
            ),
            loadingLabel = "Waiting",
        )
    }
}
