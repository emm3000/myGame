package com.emm.mygame.core.designsystem.art

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.frame.MyGameBlock
import com.emm.mygame.core.designsystem.frame.MyGameBlockHue
import com.emm.mygame.core.designsystem.text.MyGameMetaText
import com.emm.mygame.core.designsystem.text.MyGameText
import com.emm.mygame.core.designsystem.theme.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.theme.MyGameSpacing
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.MyGameTypography
import com.emm.mygame.core.designsystem.theme.PreviewMyGame

@Composable
fun MyGameAchievement(modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) {
    MyGameBlock(hue = MyGameBlockHue.Peach, modifier = modifier) {
        Row(horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step3)) {
            MyGameSeal()
            Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1), content = content)
        }
    }
}

@PreviewMyGame
@Composable
private fun MyGameAchievementPreview() {
    MyGamePreviewSurface {
        MyGameAchievement {
            MyGameMetaText(text = "Today, 9:40 AM", color = MyGameTheme.colors.onBlockMuted)
            MyGameText(text = "Farm: now level 2.", style = MyGameTypography.body, color = MyGameTheme.colors.onBlock)
        }
    }
}
