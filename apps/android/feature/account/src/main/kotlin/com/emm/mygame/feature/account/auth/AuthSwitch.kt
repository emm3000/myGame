package com.emm.mygame.feature.account.auth

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTextLink
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography

@Composable
internal fun AuthSwitch(prompt: String, linkLabel: String, onClick: () -> Unit, modifier: Modifier = Modifier) {
    FlowRow(
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        itemVerticalAlignment = Alignment.CenterVertically,
        modifier = modifier,
    ) {
        MyGameText(text = prompt, style = MyGameTypography.body, color = MyGameTheme.colors.inkMuted)
        MyGameTextLink(label = linkLabel, onClick = onClick)
    }
}
