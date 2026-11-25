package com.emm.mygame.feature.holdout

import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import com.emm.mygame.core.designsystem.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.PreviewMyGame
import com.emm.mygame.core.model.holdout.HoldoutCheckRefusal
import com.emm.mygame.core.model.holdout.HoldoutCheckWeek
import com.emm.mygame.core.model.learning.WordId
import com.emm.mygame.core.model.placement.ChoiceId
import com.emm.mygame.core.model.placement.PlacementBand
import com.emm.mygame.core.model.placement.PlacementChoice
import com.emm.mygame.core.model.placement.PlacementItem
import com.emm.mygame.core.ui.ChromePhase
import com.emm.mygame.core.ui.CopyLanguage
import com.emm.mygame.core.ui.ProvideCopyLanguage
import com.emm.mygame.core.ui.ScaffoldLanguage

private val previewHouse: PlacementItem = PlacementItem(
    word = WordId("word-24"),
    text = "house",
    choices = listOf(
        PlacementChoice(ChoiceId("0a1b2c3d"), "perro"),
        PlacementChoice(ChoiceId("4e5f6a7b"), "casa"),
        PlacementChoice(ChoiceId("8c9d0e1f"), "caminar"),
        PlacementChoice(ChoiceId("2a3b4c5d"), "agua"),
    ),
)

private val previewAsking: HoldoutCheckUiState.Asking = HoldoutCheckUiState.Asking(
    band = PlacementBand.First,
    week = HoldoutCheckWeek.Eighth,
    items = listOf(previewHouse, previewHouse.copy(word = WordId("word-25"))),
    shownIndex = 1,
    chosen = mapOf(WordId("word-24") to ChoiceId("4e5f6a7b"), WordId("word-25") to ChoiceId("4e5f6a7b")),
    request = HoldoutCheckRequest.Idle,
)

private val previewDue: HoldoutCheckUiState.Due =
    HoldoutCheckUiState.Due(PlacementBand.First, HoldoutCheckWeek.Eighth, HoldoutCheckRequest.Idle)

private class HoldoutCheckScreenStates : PreviewParameterProvider<HoldoutCheckUiState> {
    override val values: Sequence<HoldoutCheckUiState> = sequenceOf(
        previewDue,
        previewAsking.copy(shownIndex = 0, chosen = emptyMap()),
        previewAsking.copy(request = HoldoutCheckRequest.Waiting(HoldoutCheckAction.Answers)),
        HoldoutCheckUiState.Answered,
        HoldoutCheckUiState.Skipped,
        previewDue.copy(request = HoldoutCheckRequest.Refused(HoldoutCheckAction.Begin, HoldoutCheckRefusal.NotOpen)),
        previewAsking.copy(
            request = HoldoutCheckRequest.Refused(HoldoutCheckAction.Answers, HoldoutCheckRefusal.NotOpen),
        ),
        HoldoutCheckUiState.Failed,
        HoldoutCheckUiState.NotOpen,
    )
}

@PreviewMyGame
@Composable
private fun HoldoutCheckScreenPreview(@PreviewParameter(HoldoutCheckScreenStates::class) state: HoldoutCheckUiState) {
    MyGamePreviewSurface {
        HoldoutCheckScreen(state = state, onIntent = {}, onDone = {})
    }
}

@PreviewMyGame
@Composable
private fun HoldoutCheckScreenBothPreview(
    @PreviewParameter(HoldoutCheckScreenStates::class) state: HoldoutCheckUiState,
) {
    ProvideCopyLanguage(language = CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Both)) {
        MyGamePreviewSurface {
            HoldoutCheckScreen(state = state, onIntent = {}, onDone = {})
        }
    }
}
