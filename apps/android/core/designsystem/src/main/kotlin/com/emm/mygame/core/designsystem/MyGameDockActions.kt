package com.emm.mygame.core.designsystem

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.Measurable
import androidx.compose.ui.layout.MeasureResult
import androidx.compose.ui.layout.MeasureScope
import androidx.compose.ui.layout.Placeable
import androidx.compose.ui.unit.Constraints

private const val GO_SHARE: Int = 3

private const val DOOR_SHARE: Int = 1

@Composable
internal fun MyGameDockActions(
    go: @Composable () -> Unit,
    door: (@Composable () -> Unit)?,
    modifier: Modifier = Modifier,
) {
    Layout(
        contents = listOf(go, door ?: {}),
        modifier = modifier,
    ) { measurables: List<List<Measurable>>, constraints: Constraints ->
        val goButton: Measurable = measurables[0].single()
        val doorButton: Measurable? = measurables[1].singleOrNull()
        if (doorButton == null) return@Layout alone(goButton, constraints)
        if (fitsBeside(goButton, doorButton, constraints)) return@Layout beside(goButton, doorButton, constraints)
        under(goButton, doorButton, constraints)
    }
}

private fun MeasureScope.alone(go: Measurable, constraints: Constraints): MeasureResult {
    val placed: Placeable = go.measure(constraints.copy(minWidth = constraints.maxWidth, minHeight = 0))
    return layout(constraints.maxWidth, placed.height) { placed.place(0, 0) }
}

private fun MeasureScope.fitsBeside(go: Measurable, door: Measurable, constraints: Constraints): Boolean {
    val shared: Int = constraints.maxWidth - MyGameSpacing.step3.roundToPx()
    val goWidth: Int = shared * GO_SHARE / (GO_SHARE + DOOR_SHARE)
    val doorWidth: Int = shared - goWidth
    return go.maxIntrinsicWidth(Constraints.Infinity) <= goWidth &&
        door.maxIntrinsicWidth(Constraints.Infinity) <= doorWidth
}

private fun MeasureScope.under(go: Measurable, door: Measurable, constraints: Constraints): MeasureResult {
    val gap: Int = MyGameSpacing.step3.roundToPx()
    val full: Constraints = constraints.copy(minWidth = constraints.maxWidth, minHeight = 0)
    val goPlaced: Placeable = go.measure(full)
    val doorPlaced: Placeable = door.measure(full)
    return layout(constraints.maxWidth, goPlaced.height + gap + doorPlaced.height) {
        goPlaced.place(0, 0)
        doorPlaced.place(0, goPlaced.height + gap)
    }
}

private fun MeasureScope.beside(go: Measurable, door: Measurable, constraints: Constraints): MeasureResult {
    val gap: Int = MyGameSpacing.step3.roundToPx()
    val shared: Int = constraints.maxWidth - gap
    val goWidth: Int = shared * GO_SHARE / (GO_SHARE + DOOR_SHARE)
    val doorWidth: Int = shared - goWidth
    val height: Int = maxOf(go.minIntrinsicHeight(goWidth), door.minIntrinsicHeight(doorWidth))
    val goPlaced: Placeable = go.measure(Constraints.fixed(goWidth, height))
    val doorPlaced: Placeable = door.measure(Constraints.fixed(doorWidth, height))
    return layout(constraints.maxWidth, height) {
        goPlaced.place(0, 0)
        doorPlaced.place(goWidth + gap, 0)
    }
}
