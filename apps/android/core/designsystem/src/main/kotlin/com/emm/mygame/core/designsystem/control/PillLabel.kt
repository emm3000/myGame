package com.emm.mygame.core.designsystem.control

import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.IntrinsicMeasurable
import androidx.compose.ui.layout.IntrinsicMeasureScope
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.Measurable
import androidx.compose.ui.layout.MeasureResult
import androidx.compose.ui.layout.MeasureScope
import androidx.compose.ui.layout.MultiContentMeasurePolicy
import androidx.compose.ui.layout.Placeable
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Constraints
import com.emm.mygame.core.designsystem.text.MyGameLabel
import com.emm.mygame.core.designsystem.text.MyGameText
import com.emm.mygame.core.designsystem.theme.MyGameSpacing
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.MyGameTypography

private const val HALF: Int = 2

@Composable
internal fun PillLabel(
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
