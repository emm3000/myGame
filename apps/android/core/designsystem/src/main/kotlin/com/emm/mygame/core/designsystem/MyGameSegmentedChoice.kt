package com.emm.mygame.core.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.Measurable
import androidx.compose.ui.layout.MeasurePolicy
import androidx.compose.ui.layout.MeasureResult
import androidx.compose.ui.layout.MeasureScope
import androidx.compose.ui.layout.Placeable
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Constraints

@Composable
fun MyGameSegmentedChoice(groupName: String, segments: MyGameSegments, modifier: Modifier = Modifier) {
    Layout(
        content = { segments.segments.forEach { segment: MyGameSegment -> Segment(segment = segment) } },
        measurePolicy = segmentsMeasurePolicy,
        modifier = modifier
            .fillMaxWidth()
            .selectableGroup()
            .semantics { contentDescription = groupName },
    )
}

private val segmentsMeasurePolicy: MeasurePolicy =
    MeasurePolicy { measurables: List<Measurable>, constraints: Constraints ->
        val gap: Int = MyGameSpacing.step2.roundToPx()
        val share: Int = (constraints.maxWidth - gap * (measurables.size - 1)) / measurables.size
        val doesEveryLabelFit: Boolean = measurables.all { measurable: Measurable ->
            measurable.maxIntrinsicWidth(Constraints.Infinity) <= share
        }
        if (doesEveryLabelFit) oneRow(measurables, share, gap) else oneColumn(measurables, constraints.maxWidth, gap)
    }

private fun MeasureScope.oneRow(measurables: List<Measurable>, share: Int, gap: Int): MeasureResult {
    val height: Int = measurables.maxOf { measurable: Measurable -> measurable.minIntrinsicHeight(share) }
    val placeables: List<Placeable> = measurables.map { measurable: Measurable ->
        measurable.measure(Constraints(minWidth = share, maxWidth = share, minHeight = height, maxHeight = height))
    }
    val width: Int = placeables.sumOf(Placeable::width) + gap * (placeables.size - 1)
    return layout(width, placeables.maxOf(Placeable::height)) {
        placeables.fold(0) { left: Int, placeable: Placeable ->
            placeable.place(left, 0)
            left + placeable.width + gap
        }
    }
}

private fun MeasureScope.oneColumn(measurables: List<Measurable>, width: Int, gap: Int): MeasureResult {
    val placeables: List<Placeable> = measurables.map { measurable: Measurable ->
        measurable.measure(Constraints(minWidth = width, maxWidth = width))
    }
    val height: Int = placeables.sumOf(Placeable::height) + gap * (placeables.size - 1)
    return layout(width, height) {
        placeables.fold(0) { top: Int, placeable: Placeable ->
            placeable.place(0, top)
            top + placeable.height + gap
        }
    }
}

@Composable
private fun Segment(segment: MyGameSegment, modifier: Modifier = Modifier) {
    val colors: MyGameColors = MyGameTheme.colors
    val shape: Shape = RoundedCornerShape(MyGameRadii.md)
    Box(
        contentAlignment = Alignment.Center,
        modifier = modifier
            .defaultMinSize(minHeight = MyGameSizes.control)
            .clip(shape)
            .background(if (segment.isChosen) colors.ink else colors.surface)
            .border(MyGameStrokeWidths.hairline, colors.ink, shape)
            .selectable(selected = segment.isChosen, role = Role.RadioButton, onClick = segment.onClick)
            .padding(horizontal = MyGameSpacing.step2, vertical = MyGameSpacing.step1),
    ) {
        MyGameText(
            text = segment.label,
            style = MyGameTypography.label.copy(textAlign = TextAlign.Center),
            color = if (segment.isChosen) colors.surface else colors.ink,
        )
    }
}

@PreviewMyGame
@Composable
private fun MyGameSegmentedChoicePreview() {
    MyGamePreviewSurface {
        MyGameSegmentedChoice(
            groupName = "Theme",
            segments = MyGameSegments(
                listOf(
                    MyGameSegment(label = "System", isChosen = true, onClick = {}),
                    MyGameSegment(label = "Light", isChosen = false, onClick = {}),
                    MyGameSegment(label = "Dark", isChosen = false, onClick = {}),
                ),
            ),
        )
    }
}
