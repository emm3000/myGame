package com.emm.mygame.feature.signin

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
import com.emm.mygame.core.network.PlayerScaffold

@Composable
internal fun ScaffoldChoice(
    picked: PlayerScaffold,
    isEnabled: Boolean,
    onPick: (PlayerScaffold) -> Unit,
    modifier: Modifier = Modifier,
) {
    val question: String = stringResource(R.string.scaffold_label)
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
            PlayerScaffold.entries.forEach { scaffold: PlayerScaffold ->
                MyGameChoiceRow(
                    label = stringResource(optionOf(scaffold)),
                    isChosen = scaffold == picked,
                    isEnabled = isEnabled,
                    onClick = { onPick(scaffold) },
                )
            }
        }
    }
}

private fun optionOf(scaffold: PlayerScaffold): Int = when (scaffold) {
    PlayerScaffold.Spanish -> R.string.scaffold_es
    PlayerScaffold.None -> R.string.scaffold_none
}
