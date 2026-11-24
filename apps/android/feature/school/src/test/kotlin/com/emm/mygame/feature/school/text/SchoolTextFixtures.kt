package com.emm.mygame.feature.school.text

import com.emm.mygame.core.model.learning.FrameSpan
import com.emm.mygame.core.model.learning.TextId
import com.emm.mygame.core.model.learning.WordSupport
import com.emm.mygame.core.model.town.OpenText
import com.emm.mygame.core.model.town.TownTextResult
import com.emm.mygame.core.testing.FakeTownTextRepository
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runCurrent

internal val courseTextId: TextId = TextId("text-1")

internal val riverGloss: WordSupport =
    WordSupport(shown = WordSupport.Shown.Beside, text = "río", language = WordSupport.Language.Spanish)

internal val houseOnTap: WordSupport =
    WordSupport(shown = WordSupport.Shown.OnTap, text = "casa", language = WordSupport.Language.Spanish)

internal val fieldDefinition: WordSupport =
    WordSupport(shown = WordSupport.Shown.OnTap, text = "open land", language = WordSupport.Language.English)

internal val courseText: OpenText = OpenText(
    id = courseTextId,
    title = "A New Course",
    sentences = listOf(
        listOf(FrameSpan("I live by the ", null), FrameSpan("river", riverGloss), FrameSpan(".", null)),
        listOf(FrameSpan("The ", null), FrameSpan("house", houseOnTap), FrameSpan(" is my own.", null)),
        listOf(FrameSpan("I went through the ", null), FrameSpan("field", fieldDefinition), FrameSpan(".", null)),
    ),
)

internal val houseTap: SchoolTextUiState.SpanAt = SchoolTextUiState.SpanAt(sentence = 1, span = 1)

internal val fieldTap: SchoolTextUiState.SpanAt = SchoolTextUiState.SpanAt(sentence = 2, span = 1)

internal fun TestScope.schoolTextViewModelOf(texts: FakeTownTextRepository): SchoolTextViewModel {
    val viewModel: SchoolTextViewModel = SchoolTextViewModel(courseTextId, texts)
    runCurrent()
    return viewModel
}

internal fun TestScope.schoolTextReadingFrom(texts: FakeTownTextRepository, text: OpenText): SchoolTextViewModel {
    texts.answerText(TownTextResult.Read(text))
    return schoolTextViewModelOf(texts)
}
