package com.emm.mygame.feature.report.news

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.frame.MyGameHairline
import com.emm.mygame.core.designsystem.text.MyGameLabel
import com.emm.mygame.core.designsystem.text.MyGameText
import com.emm.mygame.core.designsystem.theme.MyGameSpacing
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.MyGameTypography

@Composable
internal fun NewsNote(line: MyGameLabel, modifier: Modifier = Modifier) {
    Column(modifier = modifier.fillMaxWidth()) {
        MyGameHairline()
        MyGameText(
            label = line,
            style = MyGameTypography.body,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.padding(vertical = MyGameSpacing.step3),
        )
    }
}
