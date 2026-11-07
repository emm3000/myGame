package com.emm.mygame.feature.signin

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography

@Composable
internal fun AuthHeader(title: String, modifier: Modifier = Modifier, lead: String? = null) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameText(
            text = stringResource(R.string.sign_in_brand),
            style = MyGameTypography.title,
            color = MyGameTheme.colors.action,
        )
        MyGameText(
            text = title,
            style = MyGameTypography.display,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { heading() },
        )
        if (lead != null) {
            MyGameText(text = lead, style = MyGameTypography.body, color = MyGameTheme.colors.inkMuted)
        }
    }
}
