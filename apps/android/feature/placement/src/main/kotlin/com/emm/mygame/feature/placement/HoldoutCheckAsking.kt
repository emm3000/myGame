package com.emm.mygame.feature.placement

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameButton
import com.emm.mygame.core.designsystem.MyGameChoiceRow
import com.emm.mygame.core.designsystem.MyGameMetaText
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTrack
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
        MyGameMetaText(
            text = fixedCopyResource(R.string.placement_band, "band" to asking.band.number.toString()),
            color = MyGameTheme.colors.inkMuted,
        )
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
        AskingProgress(asking = asking)
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
private fun AskingProgress(asking: HoldoutCheckUiState.Asking, modifier: Modifier = Modifier) {
    val filled: Float = (asking.shownIndex + 1).toFloat() / asking.items.size
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameText(
            text = fixedCopyResource(
                R.string.placement_progress,
                "number" to (asking.shownIndex + 1).toString(),
                "total" to asking.items.size.toString(),
            ),
            style = MyGameTypography.caption,
            color = MyGameTheme.colors.inkMuted,
        )
        MyGameTrack(
            filled = filled,
            color = MyGameTheme.colors.action,
            modifier = Modifier.semantics { progressBarRangeInfo = ProgressBarRangeInfo(filled, 0f..1f) },
        )
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
