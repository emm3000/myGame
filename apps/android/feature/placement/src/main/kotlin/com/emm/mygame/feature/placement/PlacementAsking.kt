package com.emm.mygame.feature.placement

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameBlock
import com.emm.mygame.core.designsystem.MyGameButton
import com.emm.mygame.core.designsystem.MyGameChoiceRow
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.blockHueOf
import com.emm.mygame.core.designsystem.wordStyle
import com.emm.mygame.core.network.PlacementChoice
import com.emm.mygame.core.network.PlacementItem
import com.emm.mygame.core.network.PlacementScore
import com.emm.mygame.core.ui.icuStringResource

@Composable
internal fun PlacementAsking(
    asking: PlacementUiState.Asking,
    onIntent: (PlacementIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val isWaiting: Boolean = asking.request is PlacementRequest.Waiting
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step4), modifier = modifier) {
        asking.scores.forEach { score: PlacementScore -> BandScore(score = score) }
        AskingProgress(band = asking.band, shownIndex = asking.shownIndex, total = asking.items.size)
        WordBlock(item = asking.shown, index = asking.shownIndex)
        Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2)) {
            MyGameText(
                text = stringResource(R.string.placement_prompt),
                style = MyGameTypography.caption,
                color = MyGameTheme.colors.inkMuted,
            )
            Column(
                verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
                modifier = Modifier.selectableGroup(),
            ) {
                asking.shown.choices.forEach { choice: PlacementChoice ->
                    MyGameChoiceRow(
                        label = choice.gloss,
                        isChosen = choice.id == asking.chosenForShown,
                        isEnabled = !isWaiting,
                        onClick = { onIntent(PlacementIntent.ChoiceChosen(choice.id)) },
                    )
                }
            }
        }
        if (asking.request == PlacementRequest.Unreachable) {
            MyGameInlineAlert(message = stringResource(R.string.placement_unreachable))
        }
        AskingAction(asking = asking, onIntent = onIntent)
    }
}

@Composable
internal fun WordBlock(item: PlacementItem, index: Int, modifier: Modifier = Modifier) {
    MyGameBlock(
        hue = blockHueOf(index),
        modifier = modifier.semantics(mergeDescendants = true) { liveRegion = LiveRegionMode.Polite },
    ) {
        MyGameText(
            text = item.text,
            style = wordStyle(),
            color = MyGameTheme.colors.onBlock,
            modifier = Modifier.semantics { heading() },
        )
    }
}

@Composable
private fun AskingAction(
    asking: PlacementUiState.Asking,
    onIntent: (PlacementIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val blockedReason: String? =
        if (asking.chosenForShown == null) stringResource(R.string.placement_choose) else null
    if (!asking.isLastShown) {
        MyGameButton(
            label = stringResource(R.string.placement_next),
            isBusy = false,
            busyDescription = stringResource(R.string.placement_sending),
            onClick = { onIntent(PlacementIntent.NextTapped) },
            modifier = modifier,
            blockedReason = blockedReason,
        )
        return
    }
    MyGameButton(
        label = icuStringResource(R.string.placement_send_band, "band" to asking.band.number.toString()),
        isBusy = asking.request is PlacementRequest.Waiting,
        busyDescription = stringResource(R.string.placement_sending),
        onClick = { onIntent(PlacementIntent.BandSent) },
        modifier = modifier,
        blockedReason = blockedReason,
    )
}
