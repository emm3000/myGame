package com.emm.mygame.core.designsystem.control

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.IntrinsicMeasurable
import androidx.compose.ui.layout.IntrinsicMeasureScope
import androidx.compose.ui.layout.Measurable
import androidx.compose.ui.layout.MeasureResult
import androidx.compose.ui.layout.MeasureScope
import androidx.compose.ui.layout.Placeable
import androidx.compose.ui.node.LayoutModifierNode
import androidx.compose.ui.node.ModifierNodeElement
import androidx.compose.ui.semantics.SemanticsPropertyKey
import androidx.compose.ui.semantics.SemanticsPropertyReceiver
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.unit.Constraints
import com.emm.mygame.core.designsystem.text.MyGameText
import com.emm.mygame.core.designsystem.text.withTabularFigures
import com.emm.mygame.core.designsystem.theme.MyGameSpacing
import com.emm.mygame.core.designsystem.theme.MyGameTypography

val PILL_BADGE: SemanticsPropertyKey<String> = SemanticsPropertyKey("PILL_BADGE")

private var SemanticsPropertyReceiver.pillBadge: String by PILL_BADGE

private const val HALF: Int = 2

@Composable
internal fun PillBadge(figure: String, look: MyGamePillLook, modifier: Modifier = Modifier) {
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
