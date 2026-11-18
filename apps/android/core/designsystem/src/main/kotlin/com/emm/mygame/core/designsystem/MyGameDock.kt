package com.emm.mygame.core.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
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
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.isTraversalGroup
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp

private enum class DockSlot { Probe, Shown }

private val stepStyle: TextStyle = MyGameTypography.heading

private const val HALF: Int = 2

private const val DIAMETER_PER_RADIUS: Int = 2

private const val QUARTER_TURN: Float = 90f

private const val HALF_TURN: Float = 180f

private const val THREE_QUARTER_TURN: Float = 270f

@Composable
fun MyGameDock(
    line: MyGameDockLine,
    go: MyGameDockGo,
    onFoldChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    door: MyGameDockDoor? = null,
    countdown: @Composable () -> Unit = {},
    notice: @Composable () -> Unit = {},
) {
    val halfWindow: Int = LocalWindowInfo.current.containerSize.height / HALF
    val foldChange: State<(Boolean) -> Unit> = rememberUpdatedState(onFoldChange)
    SubcomposeLayout(
        modifier = modifier.fillMaxWidth().semantics { isTraversalGroup = true },
    ) { constraints: Constraints ->
        val loose: Constraints = constraints.copy(minHeight = 0, maxHeight = Constraints.Infinity)
        val unfoldedHeight: Int = subcompose(DockSlot.Probe) {
            DockSheet(modifier = Modifier.clearAndSetSemantics { }) {
                Unfolded(line = line, go = go, door = door, countdown = countdown, notice = notice)
            }
        }.single().measure(loose).height
        val isFolded: Boolean = unfoldedHeight > halfWindow
        val shown: Placeable = subcompose(DockSlot.Shown) {
            LaunchedEffect(isFolded) { foldChange.value(isFolded) }
            DockSheet {
                if (isFolded) {
                    DockGo(go = go, step = line.step)
                } else {
                    Unfolded(line = line, go = go, door = door, countdown = countdown, notice = notice)
                }
            }
        }.single().measure(loose)
        layout(shown.width, shown.height) { shown.place(0, 0) }
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
            .padding(MyGameSpacing.step5),
        content = content,
    )
}

@Composable
private fun Unfolded(
    line: MyGameDockLine,
    go: MyGameDockGo,
    door: MyGameDockDoor?,
    countdown: @Composable () -> Unit,
    notice: @Composable () -> Unit,
) {
    val colors: MyGameColors = MyGameTheme.colors
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3)) {
        MyGameMetaText(label = line.title, color = colors.inkMuted, modifier = Modifier.semantics { heading() })
        DockStep(step = line.step, loadingLabel = go.busyDescription)
        countdown()
        notice()
        MyGameDockActions(
            go = { DockGo(go = go, step = line.step) },
            door = door?.let { shown: MyGameDockDoor -> { DockDoor(door = shown) } },
        )
    }
}

@Composable
private fun DockStep(step: MyGameLabel?, loadingLabel: String, modifier: Modifier = Modifier) {
    val isLive: Boolean = rememberHasStepChanged(step)
    if (step == null) {
        val height: Dp = lineHeightOf(stepStyle)
        MyGameSkeleton(
            isLoading = true,
            loadingLabel = loadingLabel,
            blocks = MyGameSkeletonBlocks(heights = listOf(height)),
            modifier = modifier.heightIn(min = height),
        ) { }
        return
    }
    MyGameText(
        label = step,
        style = stepStyle,
        color = MyGameTheme.colors.ink,
        modifier = modifier.semantics { if (isLive) liveRegion = LiveRegionMode.Polite },
    )
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

@Composable
private fun DockGo(go: MyGameDockGo, step: MyGameLabel?, modifier: Modifier = Modifier) {
    MyGameButton(
        label = go.label,
        isBusy = go.isBusy || step == null,
        busyDescription = go.busyDescription,
        onClick = go.onClick,
        modifier = modifier,
        blockedReason = go.blockedReason,
        badge = go.badge,
        accessibleName = step?.let { shown: MyGameLabel -> nameOf(go = go.label, step = shown) },
    )
}

@Composable
private fun DockDoor(door: MyGameDockDoor, modifier: Modifier = Modifier) {
    MyGamePill(
        look = outlinedPillLook(colors = MyGameTheme.colors, height = MyGameSizes.action)
            .copy(sidePadding = MyGameSpacing.step3),
        label = door.label,
        isBusy = false,
        busyDescription = door.label.spoken,
        onClick = door.onClick,
        modifier = modifier,
    )
}

private fun nameOf(go: MyGameLabel, step: MyGameLabel): String = "${go.spoken}, ${step.spoken}"

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

private val previewLine: MyGameDockLine = MyGameDockLine(
    title = MyGameLabel(text = "What is next", translation = "Tu siguiente paso"),
    step = MyGameLabel(text = "Reviews due: 4", translation = "Repasos pendientes: 4"),
)

private val previewGo: MyGameDockGo = MyGameDockGo(
    label = MyGameLabel(text = "Start the reviews", translation = null),
    isBusy = false,
    busyDescription = "Waiting",
    onClick = {},
    badge = "4",
)

private val previewDoor: MyGameDockDoor =
    MyGameDockDoor(label = MyGameLabel(text = "Town", translation = null), onClick = {})

private val previewLandscapeHeight: Dp = 360.dp

@PreviewMyGame
@Composable
private fun MyGameDockPreview() {
    MyGamePreviewSurface {
        MyGameDock(
            line = previewLine,
            go = previewGo,
            onFoldChange = {},
            door = previewDoor,
            countdown = {
                MyGameCountdownLine(words = "Next review:", time = "12:40", ground = MyGameCountdownGround.Paper)
            },
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
                line = previewLine,
                go = previewGo.copy(label = MyGameLabel(text = "Study the returning words", translation = null)),
                onFoldChange = {},
                door = previewDoor,
            )
        }
    }
}

@PreviewMyGame
@Composable
private fun MyGameDockLoadingPreview() {
    MyGamePreviewSurface {
        MyGameDock(line = previewLine.copy(step = null), go = previewGo, onFoldChange = {}, door = previewDoor)
    }
}

@PreviewMyGame
@Composable
private fun MyGameDockBlockedPreview() {
    MyGamePreviewSurface {
        MyGameDock(
            line = previewLine.copy(step = MyGameLabel(text = "No reviews due now.", translation = null)),
            go = previewGo.copy(blockedReason = "No reviews due now.", badge = null),
            onFoldChange = {},
            door = previewDoor,
        )
    }
}
