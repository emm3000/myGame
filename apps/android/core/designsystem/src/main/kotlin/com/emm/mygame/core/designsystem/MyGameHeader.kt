package com.emm.mygame.core.designsystem

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.Measurable
import androidx.compose.ui.layout.MeasureResult
import androidx.compose.ui.layout.MeasureScope
import androidx.compose.ui.layout.MultiContentMeasurePolicy
import androidx.compose.ui.layout.Placeable
import androidx.compose.ui.unit.Constraints

@Composable
fun MyGameHeader(
    modifier: Modifier = Modifier,
    end: @Composable () -> Unit = {},
    start: @Composable () -> Unit,
) {
    Layout(
        contents = listOf(start, end),
        measurePolicy = headerMeasurePolicy,
        modifier = modifier.fillMaxWidth(),
    )
}

private val headerMeasurePolicy: MultiContentMeasurePolicy =
    MultiContentMeasurePolicy { measurables: List<List<Measurable>>, constraints: Constraints ->
        val starts: List<Measurable> = measurables[0]
        val ends: List<Measurable> = measurables[1]
        val width: Int = constraints.maxWidth
        val gap: Int = MyGameSpacing.step4.roundToPx()
        val isOneRow: Boolean = ends.isEmpty() ||
            starts.maxIntrinsicWidthOf() + gap + ends.maxIntrinsicWidthOf() <= width
        if (isOneRow) oneRow(starts = starts, ends = ends, width = width, gap = gap) else twoRows(starts, ends, width)
    }

private fun MeasureScope.oneRow(starts: List<Measurable>, ends: List<Measurable>, width: Int, gap: Int): MeasureResult {
    val endPlaceables: List<Placeable> =
        ends.map { measurable: Measurable -> measurable.measure(Constraints(maxWidth = width)) }
    val endShare: Int = endPlaceables.maxOfOrNull { placeable: Placeable -> placeable.width + gap } ?: 0
    val startConstraints = Constraints(maxWidth = width - endShare)
    val startPlaceables: List<Placeable> = starts.map { measurable: Measurable -> measurable.measure(startConstraints) }
    val height: Int = maxOf(MyGameSizes.control.roundToPx(), (startPlaceables + endPlaceables).maxHeight())
    return layout(width, height) {
        startPlaceables.forEach { placeable: Placeable -> placeable.place(0, (height - placeable.height) / 2) }
        endPlaceables.forEach { placeable: Placeable ->
            placeable.place(width - placeable.width, (height - placeable.height) / 2)
        }
    }
}

private fun MeasureScope.twoRows(starts: List<Measurable>, ends: List<Measurable>, width: Int): MeasureResult {
    val rowConstraints = Constraints(maxWidth = width)
    val startPlaceables: List<Placeable> = starts.map { measurable: Measurable -> measurable.measure(rowConstraints) }
    val endPlaceables: List<Placeable> = ends.map { measurable: Measurable -> measurable.measure(rowConstraints) }
    val startHeight: Int = maxOf(MyGameSizes.control.roundToPx(), startPlaceables.maxHeight())
    val endTop: Int = startHeight + MyGameSpacing.step2.roundToPx()
    return layout(width, endTop + endPlaceables.maxHeight()) {
        startPlaceables.forEach { placeable: Placeable -> placeable.place(0, (startHeight - placeable.height) / 2) }
        endPlaceables.forEach { placeable: Placeable -> placeable.place(0, endTop) }
    }
}

private fun List<Measurable>.maxIntrinsicWidthOf(): Int =
    maxOfOrNull { measurable: Measurable -> measurable.maxIntrinsicWidth(Constraints.Infinity) } ?: 0

private fun List<Placeable>.maxHeight(): Int = maxOfOrNull(Placeable::height) ?: 0

@PreviewMyGame
@Composable
private fun MyGameHeaderPreview() {
    MyGamePreviewSurface {
        MyGameHeader(
            end = {
                MyGameRing(
                    count = 12,
                    total = 80,
                    countBefore = 12,
                    label = MyGameLabel(text = "12 of 80 words learned", translation = null),
                )
            },
        ) {
            MyGameBackLink(label = "Town", isEnabled = true, onClick = {})
        }
    }
}
