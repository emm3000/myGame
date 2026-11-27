package com.emm.mygame.core.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.Measurable
import androidx.compose.ui.layout.MeasurePolicy
import androidx.compose.ui.layout.MeasureResult
import androidx.compose.ui.layout.MeasureScope
import androidx.compose.ui.layout.Placeable
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTag
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Constraints
import kotlin.math.roundToInt

const val NAVIGATION_BAR: String = "navigation_bar"

internal fun navigationLabelTagOf(label: MyGameLabel): String = "${NAVIGATION_BAR}_label_${label.text}"

@Immutable
data class MyGameNavigationItems(val tabs: List<MyGameNavigationItem>)

@Immutable
data class MyGameNavigationItem(
    val label: MyGameLabel,
    val icon: ImageVector,
    val isOpen: Boolean,
    val onClick: () -> Unit,
    val count: String? = null,
)

@Composable
fun MyGameNavigationBar(items: MyGameNavigationItems, modifier: Modifier = Modifier) {
    Column(modifier = modifier.fillMaxWidth().background(MyGameTheme.colors.surfaceRaised).testTag(NAVIGATION_BAR)) {
        MyGameHairline()
        Layout(
            content = { items.tabs.forEach { item: MyGameNavigationItem -> NavigationTab(item = item) } },
            modifier = Modifier.fillMaxWidth().selectableGroup(),
            measurePolicy = TabsMeasurePolicy,
        )
    }
}

private object TabsMeasurePolicy : MeasurePolicy {
    override fun MeasureScope.measure(measurables: List<Measurable>, constraints: Constraints): MeasureResult {
        val floor: Int = MyGameSizes.control.roundToPx()
        val needs: List<Int> = measurables.map { tab: Measurable ->
            tab.maxIntrinsicWidth(Constraints.Infinity).coerceAtLeast(floor)
        }
        val room: Int = if (constraints.hasBoundedWidth) constraints.maxWidth else needs.sum()
        val widths: List<Int> = tabWidthsOf(needs = needs, room = room, floor = floor)
        val tabs: List<Placeable> = measurables.zip(widths) { tab: Measurable, width: Int ->
            tab.measure(constraints.copy(minWidth = width, maxWidth = width, minHeight = 0))
        }
        return layout(room, tabs.maxOfOrNull { tab: Placeable -> tab.height } ?: 0) {
            tabs.fold(0) { start: Int, tab: Placeable ->
                tab.placeRelative(start, 0)
                start + tab.width
            }
        }
    }
}

private fun tabWidthsOf(needs: List<Int>, room: Int, floor: Int): List<Int> {
    val count: Float = needs.size.toFloat()
    val total: Int = needs.sum()
    val floors: Float = floor * count
    val canShareEqually: Boolean = needs.all { need: Int -> need * needs.size <= room } || room <= floors
    val canFitEveryNeed: Boolean = total <= room
    val shares: List<Float> = when {
        canShareEqually -> needs.map { room / count }
        canFitEveryNeed -> needs.map { need: Int -> need + (room - total) / count }
        else -> needs.map { need: Int -> floor + (room - floors) * (need - floor) / (total - floors) }
    }
    val edges: List<Int> = shares.runningFold(0f) { edge: Float, share: Float -> edge + share }.map(Float::roundToInt)
    return edges.zipWithNext { start: Int, end: Int -> end - start }
}

@Composable
private fun NavigationTab(item: MyGameNavigationItem) {
    val colors: MyGameColors = MyGameTheme.colors
    val color: Color = if (item.isOpen) colors.ink else colors.inkMuted
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
        modifier = Modifier
            .defaultMinSize(minHeight = MyGameSizes.secondary)
            .selectable(selected = item.isOpen, role = Role.Tab, onClick = item.onClick)
            .semantics { contentDescription = listOfNotNull(item.label.spoken, item.count).joinToString(", ") },
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(MyGameSizes.track)
                .background(if (item.isOpen) colors.ink else Color.Transparent),
        )
        Box(modifier = Modifier.padding(top = MyGameSpacing.step1)) {
            MyGameIcon(icon = item.icon, tint = color)
            item.count?.let { count: String -> TabCount(count = count, modifier = Modifier.align(Alignment.TopEnd)) }
        }
        MyGameText(
            label = item.label,
            style = (if (item.isOpen) MyGameTypography.label else MyGameTypography.caption)
                .copy(textAlign = TextAlign.Center),
            color = color,
            modifier = Modifier
                .padding(horizontal = MyGameSpacing.step1)
                .padding(bottom = MyGameSpacing.step1)
                .clearAndSetSemantics { testTag = navigationLabelTagOf(item.label) },
        )
    }
}

@Composable
private fun TabCount(count: String, modifier: Modifier = Modifier) {
    val colors: MyGameColors = MyGameTheme.colors
    MyGameText(
        text = count,
        style = MyGameTypography.meta.withTabularFigures(),
        color = colors.onAction,
        modifier = modifier
            .padding(start = MyGameSpacing.step4)
            .background(colors.action, RoundedCornerShape(MyGameRadii.pill))
            .padding(horizontal = MyGameSpacing.step1)
            .clearAndSetSemantics {},
    )
}

@PreviewMyGame
@androidx.compose.runtime.Composable
private fun MyGameNavigationBarPreview() {
    MyGamePreviewSurface {
        MyGameNavigationBar(
            items = MyGameNavigationItems(
                listOf(
                    MyGameNavigationItem(MyGameLabel("Today", "Hoy"), MyGameIcons.today, isOpen = true, onClick = {}),
                    MyGameNavigationItem(MyGameLabel("Town", "Pueblo"), MyGameIcons.town, isOpen = false, onClick = {}),
                    MyGameNavigationItem(
                        MyGameLabel("Learn", "Aprender"),
                        MyGameIcons.learn,
                        isOpen = false,
                        onClick = {},
                        count = "3",
                    ),
                    MyGameNavigationItem(MyGameLabel("Me", "Yo"), MyGameIcons.me, isOpen = false, onClick = {}),
                ),
            ),
        )
    }
}
