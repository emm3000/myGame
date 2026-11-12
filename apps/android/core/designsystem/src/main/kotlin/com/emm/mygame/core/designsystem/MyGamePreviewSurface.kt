package com.emm.mygame.core.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier

@Composable
fun MyGamePreviewSurface(modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) {
    MyGameTheme {
        Column(
            verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step4),
            modifier = modifier
                .fillMaxWidth()
                .background(MyGameTheme.colors.surface)
                .padding(MyGameSpacing.step4),
            content = content,
        )
    }
}
