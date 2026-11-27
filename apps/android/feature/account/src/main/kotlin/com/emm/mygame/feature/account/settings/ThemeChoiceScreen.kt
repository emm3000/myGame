package com.emm.mygame.feature.account.settings

import androidx.annotation.StringRes
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import com.emm.mygame.core.designsystem.MyGameSegment
import com.emm.mygame.core.designsystem.MyGameSegmentedChoice
import com.emm.mygame.core.designsystem.MyGameSegments
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.model.theme.ThemePick
import com.emm.mygame.feature.account.R
import com.emm.mygame.feature.account.scaffold.ChoiceGroupTitle

@Composable
internal fun ThemeChoiceScreen(
    state: ThemeChoiceUiState,
    onIntent: (ThemeChoiceIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val question: String = stringResource(R.string.settings_theme_title)
    val segments: List<MyGameSegment> = ThemePick.entries.map { pick: ThemePick ->
        MyGameSegment(
            label = stringResource(optionOf(pick)),
            isChosen = pick == state.picked,
            onClick = { onIntent(ThemeChoiceIntent.Picked(pick)) },
        )
    }
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        ChoiceGroupTitle(text = question)
        MyGameSegmentedChoice(groupName = question, segments = MyGameSegments(segments))
    }
}

@StringRes
private fun optionOf(pick: ThemePick): Int = when (pick) {
    ThemePick.System -> R.string.settings_theme_system
    ThemePick.Light -> R.string.settings_theme_light
    ThemePick.Dark -> R.string.settings_theme_dark
}
