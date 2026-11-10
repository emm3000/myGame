package com.emm.mygame

import com.emm.mygame.core.network.NextStep
import com.emm.mygame.core.network.RetainedWords
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownLabel
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import com.emm.mygame.core.testing.hiringOf
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Instant
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class RetainedWordsViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val towns: FakeTownRepository = FakeTownRepository()

    private val firstReadAt: Instant = Instant.parse("2026-11-07T10:00:00Z")

    @Test
    fun `plays nothing on the first read`() = runTest {
        heldRead(townWith(RetainedWords(count = 2, total = 5)))

        val viewModel: RetainedWordsViewModel = shownViewModel()

        assertEquals(RetainedWordsUiState.Shown(count = 2, total = 5, countBefore = 2), viewModel.state.value)
    }

    @Test
    fun `moves the ring when a word is retained`() = runTest {
        heldRead(townWith(RetainedWords(count = 1, total = 5)))
        val viewModel: RetainedWordsViewModel = shownViewModel()

        heldRead(townWith(RetainedWords(count = 2, total = 5), readAt = firstReadAt + 1.minutes))

        assertEquals(RetainedWordsUiState.Shown(count = 2, total = 5, countBefore = 1), viewModel.state.value)
    }

    @Test
    fun `plays nothing when two reads agree`() = runTest {
        heldRead(townWith(RetainedWords(count = 1, total = 5)))
        val viewModel: RetainedWordsViewModel = shownViewModel()
        heldRead(townWith(RetainedWords(count = 2, total = 5), readAt = firstReadAt + 1.minutes))

        heldRead(townWith(RetainedWords(count = 2, total = 5), readAt = firstReadAt + 2.minutes))

        assertEquals(RetainedWordsUiState.Shown(count = 2, total = 5, countBefore = 2), viewModel.state.value)
    }

    @Test
    fun `plays nothing when the ring counts another lesson`() = runTest {
        heldRead(townWith(RetainedWords(count = 4, total = 5)))
        val viewModel: RetainedWordsViewModel = shownViewModel()

        heldRead(townWith(RetainedWords(count = 5, total = 6), readAt = firstReadAt + 1.minutes))

        assertEquals(RetainedWordsUiState.Shown(count = 5, total = 6, countBefore = 5), viewModel.state.value)
    }

    private fun TestScope.heldRead(town: TownSnapshot) {
        towns.answerRead(TownReadResult.Read(town))
        backgroundScope.launch { towns.read() }
        runCurrent()
    }

    private fun TestScope.shownViewModel(): RetainedWordsViewModel {
        val viewModel: RetainedWordsViewModel = RetainedWordsViewModel(towns, doesScreenReadTown = true)
        runCurrent()
        return viewModel
    }

    private fun townWith(retained: RetainedWords, readAt: Instant = firstReadAt): TownSnapshot = TownSnapshot(
        name = "Riverton",
        label = TownLabel.Town,
        seasonInForce = null,
        seasonEndsAt = null,
        stocks = emptyList(),
        people = TownSnapshot.People(supplied = 10, free = 4, atWork = 6),
        buildings = listOf(TownSnapshot.Building(TownBuildingKind.School, level = 1, next = null)),
        work = TownSnapshot.Work(slot = null, waitingList = emptyList(), cap = 2),
        lessons = emptyList(),
        skills = emptyList(),
        learning = TownSnapshot.Learning(cap = 10, inLearning = 0, retainedWords = retained),
        lessonSlot = null,
        hiring = hiringOf(),
        nextStep = NextStep.CaughtUp,
        nextDueAt = null,
        readAt = readAt,
    )
}
