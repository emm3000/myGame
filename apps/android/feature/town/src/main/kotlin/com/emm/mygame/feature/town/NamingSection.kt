package com.emm.mygame.feature.town

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import com.emm.mygame.core.designsystem.MyGameButton
import com.emm.mygame.core.designsystem.MyGameCard
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.designsystem.MyGamePlaceArt
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTextField
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownFoundRefusal
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.fixedCopyResource

private val placesToName: List<TownBuildingKind> = listOf(TownBuildingKind.Homes, TownBuildingKind.School)

@Composable
internal fun NamingSection(naming: TownUiState.Naming, onIntent: (TownIntent) -> Unit, modifier: Modifier = Modifier) {
    val isSubmitting: Boolean = naming.status == TownUiState.NamingStatus.Submitting
    MyGameCard(modifier = modifier) {
        Column(
            verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step4),
            modifier = Modifier.padding(vertical = MyGameSpacing.step4),
        ) {
            NamingArt()
            MyGameText(
                label = chromeResource(R.string.town_naming_title),
                style = MyGameTypography.title,
                color = MyGameTheme.colors.ink,
                modifier = Modifier.semantics { heading() },
            )
            MyGameText(
                label = chromeResource(R.string.town_naming_mayor),
                style = MyGameTypography.body,
                color = MyGameTheme.colors.ink,
            )
            MyGameTextField(
                value = naming.name,
                label = chromeResource(R.string.town_naming_field),
                isSecret = false,
                isReadOnly = isSubmitting,
                keyboardOptions = KeyboardOptions(
                    capitalization = KeyboardCapitalization.Words,
                    imeAction = ImeAction.Done,
                ),
                keyboardActions = KeyboardActions(onDone = { onIntent(TownIntent.NameSubmitted) }),
                onValueChange = { name: String -> onIntent(TownIntent.NameChanged(name)) },
            )
            namingAlertOf(naming.status)?.let { message: Int ->
                MyGameInlineAlert(message = fixedCopyResource(message))
            }
            NamingAction(status = naming.status, onIntent = onIntent)
        }
    }
}

@Composable
private fun NamingArt(modifier: Modifier = Modifier) {
    Row(horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step4), modifier = modifier) {
        placesToName.forEach { kind: TownBuildingKind ->
            MyGamePlaceArt(art = placeArtOf(kind, level = 0), risenFrom = null)
        }
    }
}

@Composable
private fun NamingAction(
    status: TownUiState.NamingStatus,
    onIntent: (TownIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    if (status == TownUiState.NamingStatus.Refused(TownFoundRefusal.PlayerAlreadyHoldsTown)) {
        MyGameButton(
            label = chromeResource(R.string.town_naming_go_to_town),
            isBusy = false,
            busyDescription = chromeResource(R.string.town_waiting).spoken,
            onClick = { onIntent(TownIntent.GoToTownTapped) },
            modifier = modifier,
        )
    } else {
        MyGameButton(
            label = chromeResource(R.string.town_naming_submit),
            isBusy = status == TownUiState.NamingStatus.Submitting,
            busyDescription = chromeResource(R.string.town_waiting).spoken,
            onClick = { onIntent(TownIntent.NameSubmitted) },
            modifier = modifier,
        )
    }
}

private fun namingAlertOf(status: TownUiState.NamingStatus): Int? = when (status) {
    TownUiState.NamingStatus.Idle, TownUiState.NamingStatus.Submitting -> null
    TownUiState.NamingStatus.Unreachable -> R.string.town_refusal_unexpected
    is TownUiState.NamingStatus.Refused -> when (status.refusal) {
        TownFoundRefusal.BlankTownName -> R.string.town_refusal_blank_town_name
        TownFoundRefusal.PlayerAlreadyHoldsTown -> R.string.town_refusal_player_already_holds_town
        TownFoundRefusal.Unrecognized -> R.string.town_refusal_unexpected
    }
}
