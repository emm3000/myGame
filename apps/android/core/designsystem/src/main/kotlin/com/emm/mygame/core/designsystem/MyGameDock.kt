package com.emm.mygame.core.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.State
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.layout.Placeable
import androidx.compose.ui.layout.SubcomposeLayout
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalWindowInfo
import androidx.compose.ui.platform.WindowInfo
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.isTraversalGroup
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp

private enum class DockSlot { Probe, Shown }

private const val HALF: Int = 2

private const val DEFAULT_FONT_SCALE: Float = 1f

private const val DIAMETER_PER_RADIUS: Int = 2

private const val QUARTER_TURN: Float = 90f

private const val HALF_TURN: Float = 180f

private const val THREE_QUARTER_TURN: Float = 270f

@Composable
fun MyGameDock(
    go: MyGameDockGo,
    step: MyGameLabel?,
    onFoldChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    notice: @Composable () -> Unit = {},
) {
    val tallestUnfolded: Float = LocalWindowInfo.current.containerSize.height / HALF /
        LocalDensity.current.fontScale.coerceAtLeast(DEFAULT_FONT_SCALE)
    val foldChange: State<(Boolean) -> Unit> = rememberUpdatedState(onFoldChange)
    SubcomposeLayout(
        modifier = modifier.fillMaxWidth().semantics { isTraversalGroup = true },
    ) { constraints: Constraints ->
        val loose: Constraints = constraints.copy(minHeight = 0, maxHeight = Constraints.Infinity)
        val unfoldedHeight: Int = subcompose(DockSlot.Probe) {
            DockContent(
                go = go,
                step = step,
                isNoticeShown = true,
                isLive = false,
                notice = notice,
                modifier = Modifier.clearAndSetSemantics { },
            )
        }.single().measure(loose).height
        val isFolded: Boolean = unfoldedHeight > tallestUnfolded
        val shown: Placeable = subcompose(DockSlot.Shown) {
            LaunchedEffect(isFolded) { foldChange.value(isFolded) }
            DockContent(
                go = go,
                step = step,
                isNoticeShown = !isFolded,
                isLive = rememberHasStepChanged(step),
                notice = notice,
            )
        }.single().measure(loose)
        layout(shown.width, shown.height) { shown.place(0, 0) }
    }
}

@Composable
private fun DockContent(
    go: MyGameDockGo,
    step: MyGameLabel?,
    isNoticeShown: Boolean,
    isLive: Boolean,
    notice: @Composable () -> Unit,
    modifier: Modifier = Modifier,
) {
    DockSheet(modifier = modifier) {
        if (isNoticeShown) notice()
        DockGo(go = go, step = step, isLive = isLive)
    }
}

@Composable
private fun DockSheet(modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) {
    val colors: MyGameColors = MyGameTheme.colors
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
        modifier = modifier
            .fillMaxWidth()
            .background(colors.surfaceRaised, RoundedCornerShape(topStart = MyGameRadii.lg, topEnd = MyGameRadii.lg))
            .topHairline(colors.line)
            .padding(horizontal = MyGameSpacing.step5, vertical = MyGameSpacing.step3),
        content = content,
    )
}

@Composable
private fun DockGo(go: MyGameDockGo, step: MyGameLabel?, isLive: Boolean) {
    MyGameButton(
        label = go.label,
        isBusy = go.isBusy,
        busyDescription = go.busyDescription,
        onClick = go.onClick,
        modifier = Modifier.semantics { if (isLive) liveRegion = LiveRegionMode.Polite },
        blockedReason = go.blockedReason,
        badge = go.badge,
        accessibleName = step?.let { shown: MyGameLabel -> nameOf(go = go.label, step = shown) },
    )
}

private fun nameOf(go: MyGameLabel, step: MyGameLabel): String = "${go.spoken}, ${step.spoken}"

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

private fun Modifier.topHairline(color: Color): Modifier = drawBehind {
    val stroke: Float = MyGameStrokeWidths.hairline.toPx()
    val inset: Float = stroke / HALF
    val cornerDiameter: Float = MyGameRadii.lg.toPx() * DIAMETER_PER_RADIUS
    val path: Path = Path().apply {
        moveTo(inset, MyGameRadii.lg.toPx())
        arcTo(
            rect = Rect(left = inset, top = inset, right = cornerDiameter, bottom = cornerDiameter),
            startAngleDegrees = HALF_TURN,
            sweepAngleDegrees = QUARTER_TURN,
            forceMoveTo = false,
        )
        arcTo(
            rect = Rect(
                left = size.width - cornerDiameter,
                top = inset,
                right = size.width - inset,
                bottom = cornerDiameter,
            ),
            startAngleDegrees = THREE_QUARTER_TURN,
            sweepAngleDegrees = QUARTER_TURN,
            forceMoveTo = false,
        )
    }
    drawPath(path = path, color = color, style = Stroke(width = stroke))
}

private val previewStep: MyGameLabel = MyGameLabel(text = "Reviews due: 4", translation = "Repasos pendientes: 4")

private val previewGo: MyGameDockGo = MyGameDockGo(
    label = MyGameLabel(text = "Start the reviews", translation = null),
    isBusy = false,
    busyDescription = MyGameLabel(text = "Waiting", translation = null),
    onClick = {},
    badge = "4",
)

private val previewLandscapeHeight: Dp = 360.dp

@PreviewMyGame
@Composable
private fun MyGameDockPreview() {
    MyGamePreviewSurface {
        MyGameDock(go = previewGo, step = previewStep, onFoldChange = {})
    }
}

@PreviewMyGame
@Composable
private fun MyGameDockNoticePreview() {
    MyGamePreviewSurface {
        MyGameDock(
            go = previewGo,
            step = previewStep,
            onFoldChange = {},
            notice = { MyGameInlineAlert(message = "We could not reach your town. Try again.") },
        )
    }
}

@PreviewMyGame
@Composable
private fun MyGameDockFoldedPreview() {
    val density: Density = LocalDensity.current
    val landscape: WindowInfo = object : WindowInfo {
        override val isWindowFocused: Boolean = true
        override val containerSize: IntSize =
            IntSize(width = 0, height = with(density) { previewLandscapeHeight.roundToPx() })
    }
    CompositionLocalProvider(LocalWindowInfo provides landscape) {
        MyGamePreviewSurface {
            MyGameDock(
                go = previewGo.copy(label = MyGameLabel(text = "Study the returning words", translation = null)),
                step = previewStep,
                onFoldChange = {},
                notice = { MyGameInlineAlert(message = "We could not reach your town. Try again.") },
            )
        }
    }
}

@PreviewMyGame
@Composable
private fun MyGameDockLoadingPreview() {
    MyGamePreviewSurface {
        MyGameDock(go = previewGo.copy(isBusy = true), step = null, onFoldChange = {})
    }
}

@PreviewMyGame
@Composable
private fun MyGameDockBlockedPreview() {
    MyGamePreviewSurface {
        MyGameDock(
            go = previewGo.copy(blockedReason = MyGameLabel(text = "No reviews due now.", translation = null), badge = null),
            step = MyGameLabel(text = "No reviews due now.", translation = null),
            onFoldChange = {},
        )
    }
}
