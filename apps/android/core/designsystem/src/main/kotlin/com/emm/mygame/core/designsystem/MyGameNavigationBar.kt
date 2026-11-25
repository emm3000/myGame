package com.emm.mygame.core.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.text.TextAutoSize
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
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
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle

const val NAVIGATION_BAR: String = "navigation_bar"

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
        Row(modifier = Modifier.fillMaxWidth().selectableGroup()) {
            items.tabs.forEach { item: MyGameNavigationItem -> NavigationTab(item = item) }
        }
    }
}

@Composable
private fun RowScope.NavigationTab(item: MyGameNavigationItem) {
    val colors: MyGameColors = MyGameTheme.colors
    val color: Color = if (item.isOpen) colors.ink else colors.inkMuted
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
        modifier = Modifier
            .weight(1f)
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
        TabLabel(
            label = item.label,
            style = (if (item.isOpen) MyGameTypography.label else MyGameTypography.caption).copy(color = color),
            modifier = Modifier.padding(bottom = MyGameSpacing.step1).clearAndSetSemantics {},
        )
    }
}

@Composable
private fun TabLabel(label: MyGameLabel, style: TextStyle, modifier: Modifier = Modifier) {
    val translation: String? = label.translation
    if (translation == null) {
        OneLine(line = label.text, style = style, modifier = modifier)
        return
    }
    MyGameTranslatedLines(text = label.text, translation = translation, style = style, modifier = modifier) {
            line: String,
            lineStyle: TextStyle,
        ->
        OneLine(line = line, style = lineStyle.copy(color = style.color))
    }
}

@Composable
private fun OneLine(line: String, style: TextStyle, modifier: Modifier = Modifier) {
    val fontScale: Float = LocalDensity.current.fontScale.coerceAtLeast(1f)
    BasicText(
        text = line,
        style = style,
        maxLines = 1,
        autoSize = TextAutoSize.StepBased(minFontSize = style.fontSize / fontScale, maxFontSize = style.fontSize),
        modifier = modifier,
    )
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
