package com.emm.mygame.feature.school

import app.cash.turbine.test
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.testing.FakeTownRepository
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

    private val towns: FakeTownRepository = FakeTownRepository()

    private val openCourse: TownSnapshot = townOf(texts = listOf(courseText))

    @Test
    fun `draws the text the school opened`() = runTest {
        val viewModel: SchoolTextViewModel = schoolTextReadingFrom(towns, openCourse)

        assertEquals(SchoolTextUiState.Reading(courseText, tapped = null), viewModel.state.value)
    }

    @Test
    fun `draws the text as not open while the stage has not reached it`() = runTest {
        val viewModel: SchoolTextViewModel = schoolTextReadingFrom(towns, townOf(texts = emptyList()))

        assertEquals(SchoolTextUiState.NotOpen, viewModel.state.value)
    }

    @Test
    fun `draws the error when the api cannot be reached`() = runTest {
        towns.answerRead(TownReadResult.Unreachable)

        val viewModel: SchoolTextViewModel = schoolTextViewModelOf(towns)

        assertEquals(SchoolTextUiState.Failed, viewModel.state.value)
    }

    @Test
    fun `reads the town again on retry`() = runTest {
        towns.answerRead(TownReadResult.Unreachable)
        val viewModel: SchoolTextViewModel = schoolTextViewModelOf(towns)
        towns.answerRead(TownReadResult.Read(openCourse))

        viewModel.onIntent(SchoolTextIntent.RetryTapped)
        runCurrent()

        assertEquals(SchoolTextUiState.Reading(courseText, tapped = null), viewModel.state.value)
    }

    @Test
    fun `reads nothing on retry while the text is drawn`() = runTest {
        val viewModel: SchoolTextViewModel = schoolTextReadingFrom(towns, openCourse)

        viewModel.onIntent(SchoolTextIntent.RetryTapped)
        runCurrent()

        assertEquals(1, towns.readCount)
    }

    @Test
    fun `leaves for the town when the player holds none`() = runTest {
        towns.answerRead(TownReadResult.NoTown)
        val viewModel: SchoolTextViewModel = SchoolTextViewModel(courseTextId, towns)

        viewModel.effects.test {
            assertEquals(SchoolTextEffect.NoTown, awaitItem())
        }
    }

    @Test
    fun `opens the support of the tapped word`() = runTest {
        val viewModel: SchoolTextViewModel = schoolTextReadingFrom(towns, openCourse)

        viewModel.onIntent(SchoolTextIntent.WordTapped(houseTap))

        assertEquals(houseOnTap, (viewModel.state.value as SchoolTextUiState.Reading).openSupport)
    }

    @Test
    fun `closes the support on a second tap of its word`() = runTest {
        val viewModel: SchoolTextViewModel = schoolTextReadingFrom(towns, openCourse)

        repeat(2) { viewModel.onIntent(SchoolTextIntent.WordTapped(houseTap)) }

        assertNull((viewModel.state.value as SchoolTextUiState.Reading).openSupport)
    }

    @Test
    fun `opens no support for a word glossed beside it`() = runTest {
        val viewModel: SchoolTextViewModel = schoolTextReadingFrom(towns, openCourse)

        viewModel.onIntent(SchoolTextIntent.WordTapped(SchoolTextUiState.SpanAt(sentence = 0, span = 1)))

        assertNull((viewModel.state.value as SchoolTextUiState.Reading).openSupport)
    }

    @Test
    fun `sends no request when a word is tapped`() = runTest {
        val viewModel: SchoolTextViewModel = schoolTextReadingFrom(towns, openCourse)

        viewModel.onIntent(SchoolTextIntent.WordTapped(houseTap))
        runCurrent()

        assertEquals(1 to emptyList<Any>(), towns.readCount to towns.lessonStarts + towns.starts)
    }

    @Test
    fun `ignores a tap before the text is drawn`() = runTest {
        towns.answerRead(TownReadResult.Unreachable)
        val viewModel: SchoolTextViewModel = schoolTextViewModelOf(towns)

        viewModel.onIntent(SchoolTextIntent.WordTapped(houseTap))

        assertEquals(SchoolTextUiState.Failed, viewModel.state.value)
    }
}
