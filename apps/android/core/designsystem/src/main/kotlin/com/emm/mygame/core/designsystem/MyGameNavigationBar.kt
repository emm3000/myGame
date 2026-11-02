package com.emm.mygame.core.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight

@Composable
fun MyGameNavigationBar(modifier: Modifier = Modifier, content: @Composable RowScope.() -> Unit) {
    Column(modifier = modifier.fillMaxWidth().background(MyGameTheme.colors.surface)) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(MyGameSizes.hairline)
                .background(MyGameTheme.colors.line),
        )
        Row(modifier = Modifier.fillMaxWidth().selectableGroup(), content = content)
    }
}

@Composable
fun RowScope.MyGameNavigationItem(
    label: String,
    isCurrent: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors: MyGameColors = MyGameTheme.colors
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = modifier
            .weight(1f)
            .selectable(selected = isCurrent, role = Role.Tab, onClick = onClick),
    ) {
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier.fillMaxWidth().heightIn(min = MyGameSizes.control),
        ) {
            MyGameText(
                text = label,
                style = MyGameTypography.action.copy(
                    fontWeight = if (isCurrent) FontWeight.Bold else FontWeight.Normal,
                ),
                color = if (isCurrent) colors.river else colors.ink,
            )
        }
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(MyGameSizes.currentMark)
                .background(if (isCurrent) colors.river else colors.surface),
        )
    }
}
