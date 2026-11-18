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

private class DockShares(val gap: Int, val go: Int, val door: Int)

private fun MeasureScope.sharesOf(constraints: Constraints): DockShares {
    val gap: Int = MyGameSpacing.step3.roundToPx()
    val shared: Int = constraints.maxWidth - gap
    val go: Int = shared * GO_SHARE / (GO_SHARE + DOOR_SHARE)
    return DockShares(gap = gap, go = go, door = shared - go)
}

private fun MeasureScope.fitsBeside(go: Measurable, door: Measurable, constraints: Constraints): Boolean {
    val shares: DockShares = sharesOf(constraints)
    return go.maxIntrinsicWidth(Constraints.Infinity) <= shares.go &&
        door.maxIntrinsicWidth(Constraints.Infinity) <= shares.door
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
    val shares: DockShares = sharesOf(constraints)
    val height: Int = maxOf(go.minIntrinsicHeight(shares.go), door.minIntrinsicHeight(shares.door))
    val goPlaced: Placeable = go.measure(Constraints.fixed(shares.go, height))
    val doorPlaced: Placeable = door.measure(Constraints.fixed(shares.door, height))
    return layout(constraints.maxWidth, height) {
        goPlaced.place(0, 0)
        doorPlaced.place(shares.go + shares.gap, 0)
    }
}
