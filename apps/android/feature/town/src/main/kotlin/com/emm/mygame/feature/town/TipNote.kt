package com.emm.mygame.feature.town

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import com.emm.mygame.core.designsystem.MyGameCard
import com.emm.mygame.core.designsystem.MyGameMetaText
import com.emm.mygame.core.designsystem.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTextButton
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.PreviewMyGame
import com.emm.mygame.core.network.TipKind
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.ui.chromeResource

@Composable
internal fun TipNote(tip: TipKind, onIntent: (TownIntent) -> Unit, modifier: Modifier = Modifier) {
    MyGameCard(modifier = modifier) {
        Column(
            verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
            modifier = Modifier.padding(top = MyGameSpacing.step3),
        ) {
            MyGameMetaText(
                label = chromeResource(R.string.town_tip_title),
                color = MyGameTheme.colors.inkMuted,
                modifier = Modifier.semantics { heading() },
            )
            MyGameText(
                label = chromeResource(lineOf(tip)),
                style = MyGameTypography.body,
                color = MyGameTheme.colors.ink,
            )
            MyGameTextButton(
                label = chromeResource(R.string.town_tip_close),
                isBusy = false,
                busyDescription = chromeResource(R.string.town_waiting).spoken,
                onClick = { onIntent(TownIntent.TipClosed(tip)) },
            )
        }
    }
}

internal fun TownUiState.Content.tipPlaceOf(tip: TipKind): TownBuildingKind = when (tip) {
    TipKind.Seasons, TipKind.FullStore -> TownBuildingKind.Storage
    TipKind.People -> TownBuildingKind.Homes
    TipKind.Office, TipKind.Jobs -> TownBuildingKind.Office
    TipKind.WaitingList -> placeInWork() ?: nextStepPlace
}

private fun TownUiState.Content.placeInWork(): TownBuildingKind? = when (val inSlot: TownUiState.SlotLine = slot) {
    is TownUiState.SlotLine.Busy -> inSlot.building
    is TownUiState.SlotLine.Done -> inSlot.building
    TownUiState.SlotLine.Idle -> waitingList.firstOrNull()?.building
}

private fun lineOf(tip: TipKind): Int = when (tip) {
    TipKind.People -> R.string.town_tip_people
    TipKind.Seasons -> R.string.town_tip_seasons
    TipKind.WaitingList -> R.string.town_tip_waiting_list
    TipKind.Office -> R.string.town_tip_office
    TipKind.Jobs -> R.string.town_tip_jobs
    TipKind.FullStore -> R.string.town_tip_full_store
}

private class TipKinds : PreviewParameterProvider<TipKind> {

    override val values: Sequence<TipKind> = TipKind.entries.asSequence()
}

@PreviewMyGame
@Composable
private fun TipNotePreview(@PreviewParameter(TipKinds::class) tip: TipKind) {
    MyGamePreviewSurface {
        TipNote(tip = tip, onIntent = {})
    }
}
