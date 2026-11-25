package com.emm.mygame.feature.placement

import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import com.emm.mygame.core.designsystem.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.PreviewMyGame
import com.emm.mygame.core.model.learning.WordId
import com.emm.mygame.core.model.placement.ChoiceId
import com.emm.mygame.core.model.placement.PlacementBand
import com.emm.mygame.core.model.placement.PlacementChoice
import com.emm.mygame.core.model.placement.PlacementItem
import com.emm.mygame.core.model.placement.PlacementScore
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

private val previewPassed: PlacementScore = PlacementScore(PlacementBand.First, score = 30, isPlacedOut = true)

private class PlacementScreenStates : PreviewParameterProvider<PlacementUiState> {
    override val values: Sequence<PlacementUiState> = sequenceOf(
        PlacementUiState.Failed,
        PlacementUiState.Offered(PlacementRequest.Idle),
        PlacementUiState.Asking(
            band = PlacementBand.Second,
            items = listOf(previewHouse, previewHouse.copy(word = WordId("word-25"))),
            scores = listOf(previewPassed),
            shownIndex = 0,
            chosen = mapOf(WordId("word-24") to ChoiceId("4e5f6a7b")),
            request = PlacementRequest.Idle,
        ),
        PlacementUiState.Closed(
            listOf(previewPassed, PlacementScore(PlacementBand.Second, score = 21, isPlacedOut = false)),
        ),
        PlacementUiState.Closed(emptyList()),
    )
}

@PreviewMyGame
@Composable
private fun PlacementScreenPreview(@PreviewParameter(PlacementScreenStates::class) state: PlacementUiState) {
    MyGamePreviewSurface {
        PlacementScreen(state = state, onIntent = {}, onDone = {})
    }
}

@PreviewMyGame
@Composable
private fun PlacementScreenBothPreview(@PreviewParameter(PlacementScreenStates::class) state: PlacementUiState) {
    ProvideCopyLanguage(language = CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Both)) {
        MyGamePreviewSurface {
            PlacementScreen(state = state, onIntent = {}, onDone = {})
        }
    }
}
