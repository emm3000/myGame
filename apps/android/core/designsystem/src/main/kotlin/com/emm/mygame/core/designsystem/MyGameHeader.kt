package com.emm.mygame.core.designsystem

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier

@Composable
fun MyGameHeader(
    modifier: Modifier = Modifier,
    end: @Composable () -> Unit = {},
    start: @Composable () -> Unit,
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step4),
        modifier = modifier.fillMaxWidth().heightIn(min = MyGameSizes.control),
    ) {
        Box(modifier = Modifier.weight(1f)) {
            start()
        }
        end()
    }
}

@PreviewMyGame
@Composable
private fun MyGameHeaderPreview() {
    MyGamePreviewSurface {
        MyGameHeader(end = { MyGameMetaText(text = "Day 4", color = MyGameTheme.colors.inkMuted) }) {
            MyGameBackLink(label = "Town", isEnabled = true, onClick = {})
        }
    }
}
