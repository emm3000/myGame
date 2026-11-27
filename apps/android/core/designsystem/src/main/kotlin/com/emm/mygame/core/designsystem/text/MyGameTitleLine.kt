package com.emm.mygame.core.designsystem.text

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.AlignmentLine
import androidx.compose.ui.layout.FirstBaseline
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.Measurable
import androidx.compose.ui.layout.MeasurePolicy
import androidx.compose.ui.layout.MeasureResult
import androidx.compose.ui.layout.MeasureScope
import androidx.compose.ui.layout.Placeable
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.constrainWidth
import com.emm.mygame.core.designsystem.theme.MyGameColors
import com.emm.mygame.core.designsystem.theme.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.theme.MyGameSpacing
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.MyGameTypography
import com.emm.mygame.core.designsystem.theme.PreviewMyGame

@Composable
fun MyGameTitleLine(
    title: MyGameLabel,
    modifier: Modifier = Modifier,
    status: MyGameLabel? = null,
    titleLineOf: (String) -> AnnotatedString = ::AnnotatedString,
) {
    val colors: MyGameColors = MyGameTheme.colors
    Layout(
        content = {
            MyGameText(label = title, style = MyGameTypography.title, color = colors.ink, styledLineOf = titleLineOf)
            status?.let { line: MyGameLabel ->
                MyGameText(label = line, style = MyGameTypography.caption, color = colors.inkMuted)
            }
        },
        measurePolicy = TitleBesideStatus,
        modifier = modifier,
    )
}

private object TitleBesideStatus : MeasurePolicy {
    override fun MeasureScope.measure(measurables: List<Measurable>, constraints: Constraints): MeasureResult {
        val title: Measurable = measurables.first()
        val status: Measurable = measurables.getOrNull(1)
            ?: return placeAlone(title.measure(constraints.copy(minWidth = 0)))
        val gap: Int = MyGameSpacing.step3.roundToPx()
        val titleWidest: Int = title.maxIntrinsicWidth(constraints.maxHeight)
        val statusWidest: Int = status.maxIntrinsicWidth(constraints.maxHeight)
        val room: Int = if (constraints.hasBoundedWidth) constraints.maxWidth - gap else titleWidest + statusWidest
        val titleShare: Int = titleShareOf(
            room = room,
            titleWidest = titleWidest,
            statusLongestWord = status.minIntrinsicWidth(constraints.maxHeight),
        )
        val titlePlaced: Placeable = title.measure(
            Constraints(maxWidth = titleShare, maxHeight = constraints.maxHeight),
        )
        val statusPlaced: Placeable = status.measure(
            Constraints(maxWidth = (room - titlePlaced.width).coerceAtLeast(0), maxHeight = constraints.maxHeight),
        )
        return placeOnOneBaseline(titlePlaced, statusPlaced, gap, constraints)
    }
}

private fun titleShareOf(room: Int, titleWidest: Int, statusLongestWord: Int): Int =
    minOf(titleWidest, maxOf(room - statusLongestWord, room / 2)).coerceAtLeast(0)

private fun MeasureScope.placeAlone(title: Placeable): MeasureResult =
    layout(title.width, title.height) { title.placeRelative(0, 0) }

private fun MeasureScope.placeOnOneBaseline(
    title: Placeable,
    status: Placeable,
    gap: Int,
    constraints: Constraints,
): MeasureResult {
    val baseline: Int = maxOf(firstBaselineOf(title), firstBaselineOf(status))
    val titleTop: Int = baseline - firstBaselineOf(title)
    val statusTop: Int = baseline - firstBaselineOf(status)
    val width: Int = constraints.constrainWidth(title.width + gap + status.width)
    val height: Int = maxOf(titleTop + title.height, statusTop + status.height)
    return layout(width, height) {
        title.placeRelative(0, titleTop)
        status.placeRelative(title.width + gap, statusTop)
    }
}

private fun firstBaselineOf(placeable: Placeable): Int {
    val baseline: Int = placeable[FirstBaseline]
    return if (baseline == AlignmentLine.Unspecified) 0 else baseline
}

@PreviewMyGame
@Composable
private fun MyGameTitleLinePreview() {
    MyGamePreviewSurface {
        MyGameTitleLine(title = MyGameLabel(text = "Lesson 1", translation = null))
        MyGameTitleLine(
            title = MyGameLabel(
                text = "Returning words: band 2, set 2",
                translation = "Palabras que vuelven: banda 2, grupo 2",
            ),
            status = MyGameLabel(text = "Studying", translation = "En estudio"),
        )
    }
}
