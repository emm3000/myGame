package com.emm.mygame.feature.school.text

import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import com.emm.mygame.core.designsystem.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.PreviewMyGame
import com.emm.mygame.core.model.learning.FrameSpan
import com.emm.mygame.core.model.learning.TextId
import com.emm.mygame.core.model.learning.WordSupport
import com.emm.mygame.core.model.town.OpenText

private fun previewSupport(shown: WordSupport.Shown, text: String, language: WordSupport.Language): WordSupport =
    WordSupport(shown = shown, text = text, language = language)

private val previewText: OpenText = OpenText(
    id = TextId("text-1"),
    title = "A New Course",
    sentences = listOf(
        listOf(
            FrameSpan(text = "I live in a little old ", support = null),
            FrameSpan(
                text = "house",
                support = previewSupport(WordSupport.Shown.Beside, "casa", WordSupport.Language.Spanish),
            ),
            FrameSpan(text = " by the river.", support = null),
        ),
        listOf(
            FrameSpan(text = "This fall I started a ", support = null),
            FrameSpan(
                text = "course",
                support = previewSupport(WordSupport.Shown.OnTap, "curso", WordSupport.Language.Spanish),
            ),
            FrameSpan(text = " at the school.", support = null),
        ),
        listOf(
            FrameSpan(text = "I went through the ", support = null),
            FrameSpan(
                text = "field",
                support = previewSupport(WordSupport.Shown.OnTap, "open land", WordSupport.Language.English),
            ),
            FrameSpan(text = ".", support = null),
        ),
    ),
)

private class SchoolTextUiStates : PreviewParameterProvider<SchoolTextUiState> {

    override val values: Sequence<SchoolTextUiState> = sequenceOf(
        SchoolTextUiState.Reading(previewText, tapped = null),
        SchoolTextUiState.Reading(previewText, tapped = SchoolTextUiState.SpanAt(sentence = 1, span = 1)),
        SchoolTextUiState.Reading(previewText, tapped = SchoolTextUiState.SpanAt(sentence = 2, span = 1)),
        SchoolTextUiState.NotOpen,
        SchoolTextUiState.Loading,
        SchoolTextUiState.Failed,
    )
}

@PreviewMyGame
@Composable
private fun SchoolTextScreenPreview(@PreviewParameter(SchoolTextUiStates::class) state: SchoolTextUiState) {
    MyGamePreviewSurface {
        SchoolTextScreen(state = state, onIntent = {}, onSchoolOpen = {})
    }
}
