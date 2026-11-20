package com.emm.mygame.core.designsystem

import androidx.compose.foundation.LocalIndication
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.drawscope.Stroke
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
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsPropertyKey
import androidx.compose.ui.semantics.SemanticsPropertyReceiver
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.semantics.testTag
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import androidx.compose.ui.unit.Constraints

val PILL_BADGE: SemanticsPropertyKey<String> = SemanticsPropertyKey("PILL_BADGE")

private var SemanticsPropertyReceiver.pillBadge: String by PILL_BADGE

private const val HALF: Int = 2

@Composable
internal fun MyGamePill(
    look: MyGamePillLook,
    label: MyGameLabel,
    isBusy: Boolean,
    busyDescription: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    blockedReason: String? = null,
    accessibleName: String? = null,
    badge: String? = null,
) {
    val colors: MyGameColors = MyGameTheme.colors
    val shape: Shape = RoundedCornerShape(MyGameRadii.md)
    val isBlocked: Boolean = blockedReason != null && !isBusy
    val isQuiet: Boolean = isBusy || isBlocked
    val ink: Color = if (isQuiet) colors.inkMuted else look.ink
    val interactions: MutableInteractionSource = remember { MutableInteractionSource() }
    val isFocused: Boolean by interactions.collectIsFocusedAsState()
    Row(
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2, Alignment.CenterHorizontally),
        verticalAlignment = Alignment.CenterVertically,
        modifier = modifier
            .fillMaxWidth()
            .defaultMinSize(minHeight = look.height)
            .outerFocusRing(look = look, isFocused = isFocused, color = colors.focus)
            .clip(shape)
            .background(if (isQuiet) colors.surfaceSunken else look.ground)
            .edge(isBlocked = isBlocked, isBusy = isBusy, look = look, colors = colors, shape = shape)
            .pillSemantics(
                tag = look.tag,
                accessibleName = accessibleName,
                state = if (isBusy) busyDescription else blockedReason,
            )
            .clickable(
                interactionSource = interactions,
                indication = LocalIndication.current,
                enabled = !isBusy,
                role = Role.Button,
                onClick = onClick,
            )
            .padding(horizontal = look.sidePadding, vertical = MyGameSpacing.step2),
    ) {
        if (isBusy) MyGameIcon(icon = MyGameIcons.hourglass, tint = ink)
        val text: @Composable () -> Unit = {
            MyGameText(
                label = label,
                style = look.style.copy(textAlign = TextAlign.Center),
                color = ink,
                modifier = if (accessibleName == null) Modifier else Modifier.clearAndSetSemantics { },
            )
        }
        if (badge == null) {
            text()
        } else {
            Layout(contents = listOf(text, { PillBadge(figure = badge, look = look) }), measurePolicy = LabelAndCount)
        }
    }
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

private fun Modifier.outerFocusRing(look: MyGamePillLook, isFocused: Boolean, color: Color): Modifier {
    if (!look.hasOuterFocusRing || !isFocused) return this
    return outerFocusRing(color)
}

private fun Modifier.outerFocusRing(color: Color): Modifier = drawBehind {
    val ring: Float = MyGameStrokeWidths.focus.toPx()
    val reach: Float = MyGameSpacing.step1.toPx() + ring / 2
    val radius: Float = MyGameRadii.md.toPx() + reach
    drawRoundRect(
        color = color,
        topLeft = Offset(-reach, -reach),
        size = Size(size.width + reach * 2, size.height + reach * 2),
        cornerRadius = CornerRadius(radius, radius),
        style = Stroke(width = ring),
    )
}

private fun Modifier.pillSemantics(tag: String, accessibleName: String?, state: String?): Modifier =
    semantics(mergeDescendants = true) {
        testTag = tag
        if (accessibleName != null) contentDescription = accessibleName
        if (state != null) stateDescription = state
    }

private fun Modifier.edge(
    isBlocked: Boolean,
    isBusy: Boolean,
    look: MyGamePillLook,
    colors: MyGameColors,
    shape: Shape,
): Modifier = when {
    isBlocked -> dashedFrame(colors.lineStrong)
    isBusy -> border(MyGameStrokeWidths.hairline, colors.lineStrong, shape)
    else -> border(MyGameStrokeWidths.hairline, look.edge, shape)
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
