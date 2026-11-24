package com.emm.mygame.feature.school.text

import app.cash.turbine.test
import com.emm.mygame.core.model.town.TownTextResult
import com.emm.mygame.core.testing.FakeTownTextRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Rule
import org.junit.Test

class SchoolTextViewModelTest {

    @get:Rule
    val mainDispatcherRule: MainDispatcherRule = MainDispatcherRule()

    private val texts: FakeTownTextRepository = FakeTownTextRepository()

    @Test
    fun `draws the text the school opened`() = runTest {
        val viewModel: SchoolTextViewModel = schoolTextReadingFrom(texts, courseText)

        assertEquals(SchoolTextUiState.Reading(courseText, tapped = null), viewModel.state.value)
    }

    @Test
    fun `draws the text as not open while the stage has not reached it`() = runTest {
        texts.answerText(TownTextResult.NotOpen)

        val viewModel: SchoolTextViewModel = schoolTextViewModelOf(texts)

        assertEquals(SchoolTextUiState.NotOpen, viewModel.state.value)
    }

    @Test
    fun `draws the error when the api cannot be reached`() = runTest {
        texts.answerText(TownTextResult.Unreachable)

        val viewModel: SchoolTextViewModel = schoolTextViewModelOf(texts)

        assertEquals(SchoolTextUiState.Failed, viewModel.state.value)
    }

    @Test
    fun `asks for the text the route names`() = runTest {
        schoolTextReadingFrom(texts, courseText)

        assertEquals(listOf(courseTextId), texts.reads)
    }

    @Test
    fun `reads the text again on retry`() = runTest {
        texts.answerText(TownTextResult.Unreachable)
        val viewModel: SchoolTextViewModel = schoolTextViewModelOf(texts)
        texts.answerText(TownTextResult.Read(courseText))

        viewModel.onIntent(SchoolTextIntent.RetryTapped)
        runCurrent()

        assertEquals(SchoolTextUiState.Reading(courseText, tapped = null), viewModel.state.value)
    }

    @Test
    fun `reads nothing on retry while the text is drawn`() = runTest {
        val viewModel: SchoolTextViewModel = schoolTextReadingFrom(texts, courseText)

        viewModel.onIntent(SchoolTextIntent.RetryTapped)
        runCurrent()

        assertEquals(1, texts.reads.size)
    }

    @Test
    fun `leaves for the town when the player holds none`() = runTest {
        texts.answerText(TownTextResult.NoTown)
        val viewModel: SchoolTextViewModel = SchoolTextViewModel(courseTextId, texts)

        viewModel.effects.test {
            assertEquals(SchoolTextEffect.NoTown, awaitItem())
        }
    }

    @Test
    fun `opens the support of the tapped word`() = runTest {
        val viewModel: SchoolTextViewModel = schoolTextReadingFrom(texts, courseText)

        viewModel.onIntent(SchoolTextIntent.WordTapped(houseTap))

        assertEquals(houseOnTap, (viewModel.state.value as SchoolTextUiState.Reading).openSupport)
    }

    @Test
    fun `closes the support on a second tap of its word`() = runTest {
        val viewModel: SchoolTextViewModel = schoolTextReadingFrom(texts, courseText)

        repeat(2) { viewModel.onIntent(SchoolTextIntent.WordTapped(houseTap)) }

        assertNull((viewModel.state.value as SchoolTextUiState.Reading).openSupport)
    }

    @Test
    fun `opens no support for a word glossed beside it`() = runTest {
        val viewModel: SchoolTextViewModel = schoolTextReadingFrom(texts, courseText)

        viewModel.onIntent(SchoolTextIntent.WordTapped(SchoolTextUiState.SpanAt(sentence = 0, span = 1)))

        assertNull((viewModel.state.value as SchoolTextUiState.Reading).openSupport)
    }

    @Test
    fun `sends no request when a word is tapped`() = runTest {
        val viewModel: SchoolTextViewModel = schoolTextReadingFrom(texts, courseText)

        viewModel.onIntent(SchoolTextIntent.WordTapped(houseTap))
        runCurrent()

        assertEquals(1, texts.reads.size)
    }

    @Test
    fun `ignores a tap before the text is drawn`() = runTest {
        texts.answerText(TownTextResult.Unreachable)
        val viewModel: SchoolTextViewModel = schoolTextViewModelOf(texts)

        viewModel.onIntent(SchoolTextIntent.WordTapped(houseTap))

        assertEquals(SchoolTextUiState.Failed, viewModel.state.value)
    }
}
