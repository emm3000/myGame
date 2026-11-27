package com.emm.mygame.feature.account.scaffold

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.text.MyGameText
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.MyGameTypography

@Composable
internal fun ChoiceGroupTitle(text: String, modifier: Modifier = Modifier) {
    MyGameText(
        text = text,
        style = MyGameTypography.label,
        color = MyGameTheme.colors.ink,
        modifier = modifier.semantics { heading() },
    )
}
