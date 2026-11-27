package com.emm.mygame.feature.placement

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.control.MyGameChoiceRow
import com.emm.mygame.core.designsystem.text.MyGameText
import com.emm.mygame.core.designsystem.theme.MyGameSpacing
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.MyGameTypography
import com.emm.mygame.core.model.placement.PlacementChoice
import com.emm.mygame.core.model.placement.PlacementScore
import com.emm.mygame.core.ui.AskingProgress
import com.emm.mygame.core.ui.WordBlock
import com.emm.mygame.core.ui.fixedCopyResource

@Composable
internal fun PlacementAsking(
    asking: PlacementUiState.Asking,
    onIntent: (PlacementIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val isWaiting: Boolean = asking.request is PlacementRequest.Waiting
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step4), modifier = modifier) {
        asking.scores.forEach { score: PlacementScore -> BandScore(score = score) }
        AskingProgress(
            band = fixedCopyResource(R.string.placement_band, "band" to asking.band.number.toString()),
            progress = fixedCopyResource(
                R.string.placement_progress,
                "number" to (asking.shownIndex + 1).toString(),
                "total" to asking.items.size.toString(),
            ),
            shownIndex = asking.shownIndex,
            total = asking.items.size,
        )
        WordBlock(item = asking.shown, index = asking.shownIndex)
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
    }
}
