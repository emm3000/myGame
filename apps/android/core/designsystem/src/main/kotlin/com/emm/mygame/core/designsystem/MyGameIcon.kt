package com.emm.mygame.core.designsystem

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.vector.ImageVector

@Composable
fun MyGameIcon(icon: ImageVector, tint: Color, modifier: Modifier = Modifier) {
    Image(
        imageVector = icon,
        contentDescription = null,
        colorFilter = ColorFilter.tint(tint),
        modifier = modifier.size(MyGameSizes.icon),
    )
}

private val previewIcons: List<ImageVector> = listOf(
    MyGameIcons.back,
    MyGameIcons.hourglass,
    MyGameIcons.alert,
    MyGameIcons.slot,
    MyGameIcons.march,
    MyGameIcons.money,
    MyGameIcons.food,
    MyGameIcons.power,
    MyGameIcons.material,
    MyGameIcons.people,
    MyGameIcons.check,
    MyGameIcons.cross,
    MyGameIcons.spring,
    MyGameIcons.summer,
    MyGameIcons.fall,
    MyGameIcons.winter,
)

@PreviewMyGame
@Composable
private fun MyGameIconPreview() {
    MyGamePreviewSurface {
        FlowRow(horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2)) {
            previewIcons.forEach { icon: ImageVector -> MyGameIcon(icon = icon, tint = MyGameTheme.colors.ink) }
        }
    }
}
