package com.emm.mygame.feature.placement

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.MyGameButton
import com.emm.mygame.core.designsystem.MyGameChoiceRow
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.network.PlacementChoice
import com.emm.mygame.core.network.PlacementItem
import com.emm.mygame.core.ui.fixedCopyResource

@Composable
internal fun HoldoutCheckAsking(
    asking: HoldoutCheckUiState.Asking,
    onIntent: (HoldoutCheckIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step4), modifier = modifier) {
        val shown: PlacementItem? = asking.shown
        if (shown != null) AskedWord(asking = asking, shown = shown, onIntent = onIntent)
        HoldoutCheckRequestLine(request = asking.request)
        AskingAction(asking = asking, onIntent = onIntent)
    }
}

@Composable
private fun AskedWord(
    asking: HoldoutCheckUiState.Asking,
    shown: PlacementItem,
    onIntent: (HoldoutCheckIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step4), modifier = modifier) {
        AskingProgress(band = asking.band, shownIndex = asking.shownIndex, total = asking.items.size)
        WordBlock(item = shown, index = asking.shownIndex)
        Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2)) {
            MyGameText(
                text = fixedCopyResource(R.string.placement_prompt),
                style = MyGameTypography.caption,
                color = MyGameTheme.colors.inkMuted,
            )
            Column(
                verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
                modifier = Modifier.selectableGroup(),
            ) {
                shown.choices.forEach { choice: PlacementChoice ->
                    MyGameChoiceRow(
                        label = choice.gloss,
                        isChosen = choice.id == asking.chosenForShown,
                        isEnabled = asking.request !is HoldoutCheckRequest.Waiting,
                        onClick = { onIntent(HoldoutCheckIntent.ChoiceChosen(choice.id)) },
                    )
                }
            }
        }
    }
}

@Composable
private fun AskingAction(
    asking: HoldoutCheckUiState.Asking,
    onIntent: (HoldoutCheckIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val isUnchosen: Boolean = asking.shown != null && asking.chosenForShown == null
    val blockedReason: String? = if (isUnchosen) fixedCopyResource(R.string.placement_choose) else null
    val sending: String = fixedCopyResource(R.string.placement_sending)
    if (!asking.isLastShown) {
        MyGameButton(
            label = fixedCopyResource(R.string.placement_next),
            isBusy = false,
            busyDescription = sending,
            onClick = { onIntent(HoldoutCheckIntent.NextTapped) },
            modifier = modifier,
            blockedReason = blockedReason,
        )
        return
    }
    MyGameButton(
        label = fixedCopyResource(R.string.placement_holdout_send),
        isBusy = asking.request is HoldoutCheckRequest.Waiting,
        busyDescription = sending,
        onClick = { onIntent(HoldoutCheckIntent.AnswersSent) },
        modifier = modifier,
        blockedReason = blockedReason,
    )
}
