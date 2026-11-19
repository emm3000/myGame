package com.emm.mygame.core.designsystem

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.Role

const val NAV_ROW_CHEVRON: String = "nav_row_chevron"

@Composable
fun MyGameNavRow(
    title: MyGameLabel,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    status: MyGameLabel? = null,
    body: MyGameLabel? = null,
    caption: MyGameLabel? = null,
) {
    val colors: MyGameColors = MyGameTheme.colors
    Column(modifier = modifier.fillMaxWidth()) {
        Row(
            horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier
                .fillMaxWidth()
                .defaultMinSize(minHeight = MyGameSizes.secondary)
                .clickable(role = Role.Button, onClick = onClick)
                .padding(vertical = MyGameSpacing.step3),
        ) {
            Column(
                verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
                modifier = Modifier.weight(1f),
            ) {
                NavRowTitle(title = title, status = status)
                body?.let { line: MyGameLabel ->
                    MyGameText(label = line, style = MyGameTypography.body, color = colors.ink)
                }
                caption?.let { line: MyGameLabel ->
                    MyGameText(label = line, style = MyGameTypography.caption, color = colors.inkMuted)
                }
            }
            MyGameIcon(icon = MyGameIcons.forward, tint = colors.ink, modifier = Modifier.testTag(NAV_ROW_CHEVRON))
        }
        MyGameHairline()
    }
}

@Composable
private fun NavRowTitle(title: MyGameLabel, status: MyGameLabel?, modifier: Modifier = Modifier) {
    val colors: MyGameColors = MyGameTheme.colors
    Row(horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        MyGameText(
            label = title,
            style = MyGameTypography.title,
            color = colors.ink,
            modifier = Modifier
                .weight(1f, fill = false)
                .alignByBaseline(),
        )
        status?.let { line: MyGameLabel ->
            MyGameText(
                label = line,
                style = MyGameTypography.caption,
                color = colors.inkMuted,
                modifier = Modifier.alignByBaseline(),
            )
        }
    }
}

@PreviewMyGame
@Composable
private fun MyGameNavRowPreview() {
    MyGamePreviewSurface {
        MyGameNavRow(title = MyGameLabel(text = "Go to the school", translation = null), onClick = {})
        MyGameNavRow(
            title = MyGameLabel(text = "Lesson 2", translation = "Lección 2"),
            status = MyGameLabel(text = "Studying", translation = "Estudiando"),
            body = MyGameLabel(text = "Work and money", translation = null),
            caption = MyGameLabel(text = "5 words · Skill: money +5 %", translation = null),
            onClick = {},
        )
    }
}
