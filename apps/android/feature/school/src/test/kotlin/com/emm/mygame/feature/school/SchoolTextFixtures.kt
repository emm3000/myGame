package com.emm.mygame.feature.school

import com.emm.mygame.core.network.FrameSpan
import com.emm.mygame.core.network.TextId
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.network.WordSupport
import com.emm.mygame.core.testing.FakeTownRepository
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runCurrent

internal val courseTextId: TextId = TextId("text-1")

internal val riverGloss: WordSupport =
    WordSupport(shown = WordSupport.Shown.Beside, text = "río", language = WordSupport.Language.Spanish)

internal val houseOnTap: WordSupport =
    WordSupport(shown = WordSupport.Shown.OnTap, text = "casa", language = WordSupport.Language.Spanish)

internal val fieldDefinition: WordSupport =
    WordSupport(shown = WordSupport.Shown.OnTap, text = "open land", language = WordSupport.Language.English)

internal val courseText: TownSnapshot.OpenText = TownSnapshot.OpenText(
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

internal fun TestScope.schoolTextViewModelOf(towns: FakeTownRepository): SchoolTextViewModel {
    val viewModel: SchoolTextViewModel = SchoolTextViewModel(courseTextId, towns)
    runCurrent()
    return viewModel
}

internal fun TestScope.schoolTextReadingFrom(towns: FakeTownRepository, town: TownSnapshot): SchoolTextViewModel {
    towns.answerRead(TownReadResult.Read(town))
    return schoolTextViewModelOf(towns)
}
