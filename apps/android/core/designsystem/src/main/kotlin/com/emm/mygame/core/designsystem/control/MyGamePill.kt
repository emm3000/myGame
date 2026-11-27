package com.emm.mygame.core.designsystem.control

import androidx.compose.foundation.LocalIndication
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.layout.IntrinsicMeasurable
import androidx.compose.ui.layout.IntrinsicMeasureScope
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.Measurable
import androidx.compose.ui.layout.MeasureResult
import androidx.compose.ui.layout.MeasureScope
import androidx.compose.ui.layout.MultiContentMeasurePolicy
import androidx.compose.ui.layout.Placeable
import androidx.compose.ui.node.LayoutModifierNode
import androidx.compose.ui.node.ModifierNodeElement
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsPropertyKey
import androidx.compose.ui.semantics.SemanticsPropertyReceiver
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.hideFromAccessibility
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.semantics.testTag
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.sp
import com.emm.mygame.core.designsystem.art.MyGameIcon
import com.emm.mygame.core.designsystem.art.MyGameIcons
import com.emm.mygame.core.designsystem.frame.dashedFrame
import com.emm.mygame.core.designsystem.text.MyGameLabel
import com.emm.mygame.core.designsystem.text.MyGameText
import com.emm.mygame.core.designsystem.text.withTabularFigures
import com.emm.mygame.core.designsystem.theme.MyGameColors
import com.emm.mygame.core.designsystem.theme.MyGameRadii
import com.emm.mygame.core.designsystem.theme.MyGameSizes
import com.emm.mygame.core.designsystem.theme.MyGameSpacing
import com.emm.mygame.core.designsystem.theme.MyGameStrokeWidths
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.MyGameTypography

const val BLOCKED_LOCK: String = "BLOCKED_LOCK"

const val PILL_CHEVRON: String = "pill_chevron"

val PILL_BADGE: SemanticsPropertyKey<String> = SemanticsPropertyKey("PILL_BADGE")

private var SemanticsPropertyReceiver.pillBadge: String by PILL_BADGE

private const val HALF: Int = 2

private val pillRingReach: Dp = MyGameSpacing.step1 + MyGameStrokeWidths.focus / 2

@Composable
internal fun MyGamePill(
    look: MyGamePillLook,
    label: MyGameLabel,
    isBusy: Boolean,
    busyDescription: MyGameLabel,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    blockedReason: MyGameLabel? = null,
    accessibleName: String? = null,
    badge: String? = null,
    labelLineOf: (String) -> AnnotatedString = ::AnnotatedString,
    caption: MyGameLabel? = null,
) {
    val state: PillState = when {
        isBusy -> PillState.Working(busyDescription)
        blockedReason != null -> PillState.Blocked(blockedReason)
        else -> PillState.Can
    }
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier.fillMaxWidth()) {
        PillFace(
            look = look,
            text = MyGamePillText(label = label, caption = caption, labelLineOf = labelLineOf),
            state = state,
            onClick = onClick,
            accessibleName = accessibleName,
            badge = badge,
        )
        PillStateLine(state = state)
    }
}

@Composable
private fun PillFace(
    look: MyGamePillLook,
    text: MyGamePillText,
    state: PillState,
    onClick: () -> Unit,
    accessibleName: String?,
    badge: String?,
) {
    val colors: MyGameColors = MyGameTheme.colors
    val shape: Shape = RoundedCornerShape(MyGameRadii.md)
    val isQuiet: Boolean = state != PillState.Can
    val ink: Color = if (isQuiet) colors.inkMuted else look.ink
    val interactions: MutableInteractionSource = remember { MutableInteractionSource() }
    val isFocused: Boolean by interactions.collectIsFocusedAsState()
    Row(
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2, Alignment.CenterHorizontally),
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .fillMaxWidth()
            .defaultMinSize(minHeight = look.height)
            .pillFocusRing(look = look, isFocused = isFocused, color = colors.focus)
            .clip(shape)
            .background(if (isQuiet) colors.surfaceSunken else look.ground)
            .edge(state = state, look = look, colors = colors, shape = shape)
            .pillSemantics(tag = look.tag, accessibleName = accessibleName, state = state.spoken)
            .clickable(
                interactionSource = interactions,
                indication = LocalIndication.current,
                enabled = state !is PillState.Working,
                role = Role.Button,
                onClick = onClick,
            )
            .padding(horizontal = look.sidePadding, vertical = MyGameSpacing.step2),
    ) {
        StateMark(state = state, ink = ink)
        Box(modifier = Modifier.weight(1f, fill = false)) {
            PillLabel(
                look = look,
                text = text,
                ink = ink,
                accessibleName = accessibleName,
                badge = badge,
            )
        }
        if (look.hasForwardChevron) PillChevron(ink = ink)
    }
}

@Composable
private fun PillChevron(ink: Color) {
    val side: Dp = with(LocalDensity.current) { MyGameSizes.iconSmall.value.sp.toDp() }
    MyGameIcon(
        icon = MyGameIcons.forward,
        tint = ink,
        modifier = Modifier.semantics { testTag = PILL_CHEVRON }.size(side),
    )
}

@Composable
private fun StateMark(state: PillState, ink: Color) {
    when (state) {
        is PillState.Working -> MyGameWorkingDots(tint = ink)
        is PillState.Blocked ->
            MyGameIcon(icon = MyGameIcons.lock, tint = ink, modifier = Modifier.semantics { testTag = BLOCKED_LOCK })
        PillState.Can -> Unit
    }
}

@Composable
private fun PillStateLine(state: PillState) {
    val colors: MyGameColors = MyGameTheme.colors
    val (line: MyGameLabel, color: Color) = when (state) {
        is PillState.Working -> state.description to colors.inkMuted
        is PillState.Blocked -> state.reason to colors.warningInk
        PillState.Can -> return
    }
    MyGameText(
        label = line,
        style = MyGameTypography.caption,
        color = color,
        modifier = Modifier.semantics { hideFromAccessibility() },
    )
}

@Composable
private fun PillLabel(
    look: MyGamePillLook,
    text: MyGamePillText,
    ink: Color,
    accessibleName: String?,
    badge: String?,
) {
    val lines: @Composable () -> Unit = {
        PillLines(
            look = look,
            text = text,
            ink = ink,
            modifier = if (accessibleName == null) Modifier else Modifier.clearAndSetSemantics { },
        )
    }
    if (badge == null) {
        lines()
        return
    }
    Layout(contents = listOf(lines, { PillBadge(figure = badge, look = look) }), measurePolicy = LabelAndCount)
}

@Composable
private fun PillLines(look: MyGamePillLook, text: MyGamePillText, ink: Color, modifier: Modifier = Modifier) {
    val caption: MyGameLabel? = text.caption
    if (caption == null) {
        PillLabelLine(look = look, text = text, ink = ink, modifier = modifier)
        return
    }
    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = modifier) {
        PillLabelLine(look = look, text = text, ink = ink)
        MyGameText(
            label = caption,
            style = MyGameTypography.caption.copy(textAlign = TextAlign.Center),
            color = MyGameTheme.colors.inkMuted,
        )
    }
}

@Composable
private fun PillLabelLine(look: MyGamePillLook, text: MyGamePillText, ink: Color, modifier: Modifier = Modifier) {
    MyGameText(
        label = text.label,
        style = look.style.copy(textAlign = TextAlign.Center),
        color = ink,
        styledLineOf = text.labelLineOf,
        modifier = modifier,
    )
}

private object LabelAndCount : MultiContentMeasurePolicy {

    override fun MeasureScope.measure(
        measurables: List<List<Measurable>>,
        constraints: Constraints,
    ): MeasureResult {
        val label: Measurable = measurables[0].single()
        val disc: Placeable = measurables[1].single().measure(Constraints())
        val gap: Int = MyGameSpacing.step2.roundToPx()
        val room: Int = roomBeside(width = constraints.maxWidth, side = disc.width, gap = gap)
        if (room < label.minIntrinsicWidth(Constraints.Infinity)) return under(label, disc, gap, constraints)
        return beside(label.measure(Constraints(maxWidth = room)), disc, gap)
    }

    override fun IntrinsicMeasureScope.minIntrinsicWidth(
        measurables: List<List<IntrinsicMeasurable>>,
        height: Int,
    ): Int = maxOf(measurables[0].single().minIntrinsicWidth(height), measurables[1].single().minIntrinsicWidth(height))

    override fun IntrinsicMeasureScope.maxIntrinsicWidth(
        measurables: List<List<IntrinsicMeasurable>>,
        height: Int,
    ): Int = measurables[0].single().maxIntrinsicWidth(height) + MyGameSpacing.step2.roundToPx() +
        measurables[1].single().maxIntrinsicWidth(height)

    override fun IntrinsicMeasureScope.minIntrinsicHeight(
        measurables: List<List<IntrinsicMeasurable>>,
        width: Int,
    ): Int = heightAt(measurables, width) { label: IntrinsicMeasurable, at: Int -> label.minIntrinsicHeight(at) }

    override fun IntrinsicMeasureScope.maxIntrinsicHeight(
        measurables: List<List<IntrinsicMeasurable>>,
        width: Int,
    ): Int = heightAt(measurables, width) { label: IntrinsicMeasurable, at: Int -> label.maxIntrinsicHeight(at) }

    private fun IntrinsicMeasureScope.heightAt(
        measurables: List<List<IntrinsicMeasurable>>,
        width: Int,
        labelHeightAt: (IntrinsicMeasurable, Int) -> Int,
    ): Int {
        val label: IntrinsicMeasurable = measurables[0].single()
        val side: Int = measurables[1].single().maxIntrinsicWidth(Constraints.Infinity)
        val gap: Int = MyGameSpacing.step2.roundToPx()
        val room: Int = roomBeside(width = width, side = side, gap = gap)
        if (room < label.minIntrinsicWidth(Constraints.Infinity)) return labelHeightAt(label, width) + gap + side
        return maxOf(labelHeightAt(label, room), side)
    }

    private fun roomBeside(width: Int, side: Int, gap: Int): Int =
        if (width == Constraints.Infinity) Constraints.Infinity else width - side - gap

    private fun MeasureScope.beside(text: Placeable, disc: Placeable, gap: Int): MeasureResult {
        val height: Int = maxOf(text.height, disc.height)
        return layout(text.width + gap + disc.width, height) {
            text.place(x = 0, y = (height - text.height) / HALF)
            disc.place(x = text.width + gap, y = (height - disc.height) / HALF)
        }
    }

    private fun MeasureScope.under(
        label: Measurable,
        disc: Placeable,
        gap: Int,
        constraints: Constraints,
    ): MeasureResult {
        val text: Placeable = label.measure(Constraints(maxWidth = constraints.maxWidth))
        val width: Int = maxOf(text.width, disc.width)
        return layout(width, text.height + gap + disc.height) {
            text.place(x = (width - text.width) / HALF, y = 0)
            disc.place(x = (width - disc.width) / HALF, y = text.height + gap)
        }
    }
}

@Composable
private fun PillBadge(figure: String, look: MyGamePillLook, modifier: Modifier = Modifier) {
    MyGameText(
        text = figure,
        style = MyGameTypography.label.withTabularFigures(),
        color = look.badgeInk,
        modifier = modifier
            .clearAndSetSemantics { pillBadge = figure }
            .clip(CircleShape)
            .background(look.badgeGround)
            .square()
            .padding(horizontal = MyGameSpacing.step2),
    )
}

private fun Modifier.square(): Modifier = this then SquareElement

private data object SquareElement : ModifierNodeElement<SquareNode>() {
    override fun create(): SquareNode = SquareNode()

    override fun update(node: SquareNode): Unit = Unit
}

private class SquareNode : Modifier.Node(), LayoutModifierNode {

    override fun MeasureScope.measure(measurable: Measurable, constraints: Constraints): MeasureResult {
        val content: Placeable = measurable.measure(constraints)
        val side: Int = maxOf(content.width, content.height)
        return layout(side, side) {
            content.place(x = (side - content.width) / HALF, y = (side - content.height) / HALF)
        }
    }

    override fun IntrinsicMeasureScope.minIntrinsicWidth(measurable: IntrinsicMeasurable, height: Int): Int =
        squareSideAtWidth(measurable, measurable.minIntrinsicWidth(height))

    override fun IntrinsicMeasureScope.maxIntrinsicWidth(measurable: IntrinsicMeasurable, height: Int): Int =
        squareSideAtWidth(measurable, measurable.maxIntrinsicWidth(height))

    override fun IntrinsicMeasureScope.minIntrinsicHeight(measurable: IntrinsicMeasurable, width: Int): Int =
        squareSideAtHeight(measurable, measurable.minIntrinsicHeight(width), width)

    override fun IntrinsicMeasureScope.maxIntrinsicHeight(measurable: IntrinsicMeasurable, width: Int): Int =
        squareSideAtHeight(measurable, measurable.maxIntrinsicHeight(width), width)

    private fun squareSideAtWidth(measurable: IntrinsicMeasurable, contentWidth: Int): Int =
        maxOf(contentWidth, measurable.minIntrinsicHeight(contentWidth))

    private fun squareSideAtHeight(measurable: IntrinsicMeasurable, contentHeight: Int, width: Int): Int =
        maxOf(contentHeight, measurable.maxIntrinsicWidth(Constraints.Infinity).coerceAtMost(width))
}

private fun Modifier.pillFocusRing(look: MyGamePillLook, isFocused: Boolean, color: Color): Modifier =
    focusRingAround(
        isFocused = isFocused && look.hasOuterFocusRing,
        color = color,
        horizontalReach = pillRingReach,
        verticalReach = pillRingReach,
        radius = MyGameRadii.md + pillRingReach,
    )

private fun Modifier.pillSemantics(tag: String, accessibleName: String?, state: String?): Modifier =
    semantics(mergeDescendants = true) {
        testTag = tag
        if (accessibleName != null) contentDescription = accessibleName
        if (state != null) stateDescription = state
    }

private fun Modifier.edge(
    state: PillState,
    look: MyGamePillLook,
    colors: MyGameColors,
    shape: Shape,
): Modifier = when (state) {
    is PillState.Blocked -> dashedFrame(colors.lineStrong)
    is PillState.Working -> border(MyGameStrokeWidths.hairline, colors.lineStrong, shape)
    PillState.Can -> border(look.edgeWidth, look.edge, shape)
}

internal data class MyGamePillState(
    val label: String,
    val isBusy: Boolean,
    val busyDescription: String,
    val blockedReason: String?,
)

internal class MyGamePillStates : PreviewParameterProvider<MyGamePillState> {

    override val values: Sequence<MyGamePillState> = sequenceOf(
        MyGamePillState(label = "Build the farm", isBusy = false, busyDescription = "Building", blockedReason = null),
        MyGamePillState(
            label = "Build the farm",
            isBusy = false,
            busyDescription = "Building",
            blockedReason = "Not enough material",
        ),
        MyGamePillState(label = "Build the farm", isBusy = true, busyDescription = "Building", blockedReason = null),
        MyGamePillState(
            label = "Study lesson 1 of the school · 2:30",
            isBusy = false,
            busyDescription = "Studying",
            blockedReason = null,
        ),
    )
}

private sealed interface PillState {
    val spoken: String?

    data object Can : PillState {
        override val spoken: String? = null
    }

    data class Working(val description: MyGameLabel) : PillState {
        override val spoken: String = description.spoken
    }

    data class Blocked(val reason: MyGameLabel) : PillState {
        override val spoken: String = reason.spoken
    }
}
