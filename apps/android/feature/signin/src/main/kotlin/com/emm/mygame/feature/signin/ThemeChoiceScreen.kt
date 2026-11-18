package com.emm.mygame.feature.signin

import androidx.annotation.StringRes
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameChoiceRow
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.network.ThemePick

@Composable
internal fun ThemeChoiceScreen(
    state: ThemeChoiceUiState,
    onIntent: (ThemeChoiceIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val question: String = stringResource(R.string.settings_theme_title)
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameText(
            text = question,
            style = MyGameTypography.label,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { heading() },
        )
        Column(
            verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
            modifier = Modifier
                .selectableGroup()
                .semantics { contentDescription = question },
        ) {
            ThemePick.entries.forEach { pick: ThemePick ->
                MyGameChoiceRow(
                    label = stringResource(optionOf(pick)),
                    isChosen = pick == state.picked,
                    isEnabled = true,
                    onClick = { onIntent(ThemeChoiceIntent.Picked(pick)) },
                )
            }
        }
    }
}

@StringRes
private fun optionOf(pick: ThemePick): Int = when (pick) {
    ThemePick.System -> R.string.settings_theme_system
    ThemePick.Light -> R.string.settings_theme_light
    ThemePick.Dark -> R.string.settings_theme_dark
}
