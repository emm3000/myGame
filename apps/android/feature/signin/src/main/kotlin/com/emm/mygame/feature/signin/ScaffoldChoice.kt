package com.emm.mygame.feature.signin

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameChoiceRow
import com.emm.mygame.core.designsystem.MyGameSectionTitle
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.model.account.PlayerScaffold

@Composable
internal fun ScaffoldChoice(
    picked: PlayerScaffold,
    isEnabled: Boolean,
    onPick: (PlayerScaffold) -> Unit,
    modifier: Modifier = Modifier,
) {
    val question: String = stringResource(R.string.scaffold_label)
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameSectionTitle(text = question)
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
