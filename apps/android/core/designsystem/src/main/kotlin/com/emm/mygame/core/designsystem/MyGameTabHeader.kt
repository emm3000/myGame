package com.emm.mygame.core.designsystem

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.Measurable
import androidx.compose.ui.layout.MeasureResult
import androidx.compose.ui.layout.MeasureScope
import androidx.compose.ui.layout.MultiContentMeasurePolicy
import androidx.compose.ui.layout.Placeable
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Constraints

@Composable
fun MyGameTabHeader(
    title: String,
    modifier: Modifier = Modifier,
    ring: @Composable () -> Unit = {},
    under: @Composable () -> Unit = {},
) {
    MyGameTabHeader(
        title = MyGameLabel(text = title, translation = null),
        modifier = modifier,
        ring = ring,
        under = under,
    )
}

@Composable
fun MyGameTabHeader(
    title: MyGameLabel,
    modifier: Modifier = Modifier,
    ring: @Composable () -> Unit = {},
    under: @Composable () -> Unit = {},
) {
    Layout(
        contents = listOf({ TabTitle(title = title) }, ring, under),
        measurePolicy = tabHeaderMeasurePolicy,
        modifier = modifier.fillMaxWidth(),
    )
}

@Composable
private fun TabTitle(title: MyGameLabel) {
    Box(modifier = Modifier.semantics(mergeDescendants = true) { heading() }) {
        MyGameText(label = title, style = MyGameTypography.headline, color = MyGameTheme.colors.ink)
    }
}

private class TabHeaderParts(val titles: List<Measurable>, val rings: List<Measurable>, val unders: List<Measurable>)

private val tabHeaderMeasurePolicy: MultiContentMeasurePolicy =
    MultiContentMeasurePolicy { measurables: List<List<Measurable>>, constraints: Constraints ->
        val parts = TabHeaderParts(titles = measurables[0], rings = measurables[1], unders = measurables[2])
        val width: Int = constraints.maxWidth
        val gap: Int = MyGameSpacing.step4.roundToPx()
        val startMinWidth: Int = maxOf(parts.titles.minIntrinsicWidthOf(), parts.unders.minIntrinsicWidthOf())
        val isOneRow: Boolean =
            parts.rings.isEmpty() || startMinWidth + gap + parts.rings.minIntrinsicWidthOf() <= width
        if (isOneRow) oneRow(parts, width, ringMaxWidth = width - gap - startMinWidth, gap) else stacked(parts, width)
    }

private fun MeasureScope.oneRow(parts: TabHeaderParts, width: Int, ringMaxWidth: Int, gap: Int): MeasureResult {
    val rings: List<Placeable> = parts.rings.measureEach(Constraints(maxWidth = maxOf(0, ringMaxWidth)))
    val ringShare: Int = rings.maxOfOrNull { placeable: Placeable -> placeable.width + gap } ?: 0
    val startConstraints = Constraints(maxWidth = width - ringShare)
    val titles: List<Placeable> = parts.titles.measureEach(startConstraints)
    val unders: List<Placeable> = parts.unders.measureEach(startConstraints)
    val rowHeight: Int = maxOf(titles.maxHeight(), rings.maxHeight())
    return layout(width, rowHeight + unders.maxHeight()) {
        titles.forEach { placeable: Placeable -> placeable.place(0, (rowHeight - placeable.height) / 2) }
        rings.forEach { placeable: Placeable ->
            placeable.place(width - placeable.width, (rowHeight - placeable.height) / 2)
        }
        unders.forEach { placeable: Placeable -> placeable.place(0, rowHeight) }
    }
}

private fun MeasureScope.stacked(parts: TabHeaderParts, width: Int): MeasureResult {
    val rowConstraints = Constraints(maxWidth = width)
    val titles: List<Placeable> = parts.titles.measureEach(rowConstraints)
    val unders: List<Placeable> = parts.unders.measureEach(rowConstraints)
    val rings: List<Placeable> = parts.rings.measureEach(rowConstraints)
    val underTop: Int = titles.maxHeight()
    val ringTop: Int = underTop + unders.maxHeight() + MyGameSpacing.step2.roundToPx()
    return layout(width, ringTop + rings.maxHeight()) {
        titles.forEach { placeable: Placeable -> placeable.place(0, 0) }
        unders.forEach { placeable: Placeable -> placeable.place(0, underTop) }
        rings.forEach { placeable: Placeable -> placeable.place(0, ringTop) }
    }
}

private fun List<Measurable>.measureEach(constraints: Constraints): List<Placeable> =
    map { measurable: Measurable -> measurable.measure(constraints) }

private fun List<Measurable>.minIntrinsicWidthOf(): Int =
    maxOfOrNull { measurable: Measurable -> measurable.minIntrinsicWidth(Constraints.Infinity) } ?: 0

private fun List<Placeable>.maxHeight(): Int = maxOfOrNull(Placeable::height) ?: 0

@PreviewMyGame
@Composable
private fun MyGameTabHeaderPreview() {
    MyGamePreviewSurface {
        MyGameTabHeader(
            title = "Riverton · Town",
            ring = {
                MyGameRing(
                    count = 0,
                    total = 5,
                    countBefore = 0,
                    label = MyGameLabel(text = "0 of 5 words learned", translation = null),
                )
            },
            under = { MyGameTextLink(label = "Town News", onClick = {}) },
        )
    }
}
