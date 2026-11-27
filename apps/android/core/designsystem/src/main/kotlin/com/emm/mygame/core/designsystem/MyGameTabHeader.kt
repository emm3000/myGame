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
        val startMaxWidth: Int = if (parts.rings.isEmpty()) width else width - gap - parts.rings.minIntrinsicWidthOf()
        val isOneRow: Boolean = parts.rings.isEmpty() || parts.fitsStartIn(startMaxWidth)
        if (isOneRow) oneRow(parts, width, startMaxWidth, gap) else stacked(parts, width)
    }

private fun TabHeaderParts.fitsStartIn(startMaxWidth: Int): Boolean {
    val startMinWidth: Int = maxOf(titles.minIntrinsicWidthOf(), unders.minIntrinsicWidthOf())
    val oneLineHeight: Int = titles.minIntrinsicHeightAt(Constraints.Infinity)
    val wrappedHeight: Int = titles.minIntrinsicHeightAt(startMaxWidth)
    return startMinWidth <= startMaxWidth && wrappedHeight <= TITLE_LINES_BESIDE_RING * oneLineHeight
}

private fun MeasureScope.oneRow(parts: TabHeaderParts, width: Int, startMaxWidth: Int, gap: Int): MeasureResult {
    val startConstraints = Constraints(maxWidth = maxOf(0, startMaxWidth))
    val titles: List<Placeable> = parts.titles.measureEach(startConstraints)
    val unders: List<Placeable> = parts.unders.measureEach(startConstraints)
    val startShare: Int = maxOf(titles.maxWidth(), unders.maxWidth()) + gap
    val rings: List<Placeable> = parts.rings.measureEach(Constraints(maxWidth = maxOf(0, width - startShare)))
    val titleHeight: Int = titles.maxHeight()
    val ringHeight: Int = rings.maxHeight()
    val center: Int = maxOf(titleHeight, ringHeight) / 2
    val titleTop: Int = center - titleHeight / 2
    val ringTop: Int = center - ringHeight / 2
    val underTop: Int = titleTop + titleHeight
    return layout(width, maxOf(underTop + unders.maxHeight(), ringTop + ringHeight)) {
        titles.forEach { placeable: Placeable -> placeable.place(0, titleTop) }
        rings.forEach { placeable: Placeable -> placeable.place(width - placeable.width, ringTop) }
        unders.forEach { placeable: Placeable -> placeable.place(0, underTop) }
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

private fun List<Measurable>.minIntrinsicHeightAt(width: Int): Int =
    maxOfOrNull { measurable: Measurable -> measurable.minIntrinsicHeight(width) } ?: 0

private fun List<Placeable>.maxHeight(): Int = maxOfOrNull(Placeable::height) ?: 0

private fun List<Placeable>.maxWidth(): Int = maxOfOrNull(Placeable::width) ?: 0

private const val TITLE_LINES_BESIDE_RING: Int = 2

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
