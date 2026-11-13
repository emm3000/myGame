package com.emm.mygame.feature.placement

import com.emm.mygame.core.network.HoldoutCheck
import com.emm.mygame.core.network.HoldoutCheckChangeResult
import com.emm.mygame.core.network.HoldoutCheckRefusal
import com.emm.mygame.core.network.HoldoutCheckWeek
import com.emm.mygame.core.network.HoldoutChecksReadResult
import com.emm.mygame.core.network.PlacementAnswer
import com.emm.mygame.core.network.PlacementBand
import com.emm.mygame.core.testing.FakeHoldoutCheckRepository
import com.emm.mygame.core.testing.HoldoutCheckChange
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class HoldoutCheckViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val holdoutChecks: FakeHoldoutCheckRepository = FakeHoldoutCheckRepository()

    private fun firstBandEighthWeek(): HoldoutCheckViewModel =
        HoldoutCheckViewModel(holdoutChecks, PlacementBand.First, HoldoutCheckWeek.Eighth)

    private fun TestScope.reading(vararg checks: HoldoutCheck): HoldoutCheckViewModel {
        val viewModel: HoldoutCheckViewModel = firstBandEighthWeek()
        holdoutChecks.answerRead(HoldoutChecksReadResult.Read(checks.toList()))
        runCurrent()
        return viewModel
    }

    private fun TestScope.askingWithEveryWordChosen(): HoldoutCheckViewModel {
        val viewModel: HoldoutCheckViewModel = reading(firstBandEighthWeekAsking)
        viewModel.onIntent(HoldoutCheckIntent.ChoiceChosen(houseMeaning))
        viewModel.onIntent(HoldoutCheckIntent.NextTapped)
        viewModel.onIntent(HoldoutCheckIntent.ChoiceChosen(walkMeaning))
        return viewModel
    }

    private fun askingOf(viewModel: HoldoutCheckViewModel): HoldoutCheckUiState.Asking =
        viewModel.state.value as HoldoutCheckUiState.Asking

    private val dueIdle: HoldoutCheckUiState.Due =
        HoldoutCheckUiState.Due(PlacementBand.First, HoldoutCheckWeek.Eighth, HoldoutCheckRequest.Idle)

    @Test
    fun `draws loading until the checks answer`() = runTest {
        val viewModel: HoldoutCheckViewModel = firstBandEighthWeek()
        runCurrent()

        assertEquals(HoldoutCheckUiState.Loading, viewModel.state.value)
    }

    @Test
    fun `draws the due check the read names`() = runTest {
        val viewModel: HoldoutCheckViewModel = reading(secondBandTwentyFourthWeekDue, firstBandEighthWeekDue)

        assertEquals(dueIdle, viewModel.state.value)
    }

    @Test
    fun `draws the check not open when the read names no check of its band and week`() = runTest {
        val viewModel: HoldoutCheckViewModel = reading(secondBandTwentyFourthWeekDue)

        assertEquals(HoldoutCheckUiState.NotOpen, viewModel.state.value)
    }

    @Test
    fun `draws the words of a check begun before`() = runTest {
        val viewModel: HoldoutCheckViewModel = reading(firstBandEighthWeekAsking)

        assertEquals(
            HoldoutCheckUiState.Asking(
                band = PlacementBand.First,
                week = HoldoutCheckWeek.Eighth,
                items = listOf(house, walk),
                shownIndex = 0,
                chosen = emptyMap(),
                request = HoldoutCheckRequest.Idle,
            ),
            viewModel.state.value,
        )
    }

    @Test
    fun `draws failed when the checks cannot be read`() = runTest {
        val viewModel: HoldoutCheckViewModel = firstBandEighthWeek()
        holdoutChecks.answerRead(HoldoutChecksReadResult.Unreachable)
        runCurrent()

        assertEquals(HoldoutCheckUiState.Failed, viewModel.state.value)
    }

    @Test
    fun `reads the checks again on retry`() = runTest {
        val viewModel: HoldoutCheckViewModel = firstBandEighthWeek()
        holdoutChecks.answerRead(HoldoutChecksReadResult.Unreachable)
        runCurrent()

        viewModel.onIntent(HoldoutCheckIntent.RetryTapped)
        holdoutChecks.answerRead(HoldoutChecksReadResult.Read(listOf(firstBandEighthWeekDue)))
        runCurrent()

        assertEquals(dueIdle, viewModel.state.value)
    }

    @Test
    fun `begins the check of its band and week when the player starts it`() = runTest {
        val viewModel: HoldoutCheckViewModel = reading(firstBandEighthWeekDue)

        viewModel.onIntent(HoldoutCheckIntent.StartTapped)
        runCurrent()

        assertEquals(
            listOf(HoldoutCheckChange.Begin(PlacementBand.First, HoldoutCheckWeek.Eighth)),
            holdoutChecks.changes,
        )
    }

    @Test
    fun `draws the start waiting while the begin is in flight`() = runTest {
        val viewModel: HoldoutCheckViewModel = reading(firstBandEighthWeekDue)

        viewModel.onIntent(HoldoutCheckIntent.StartTapped)
        runCurrent()

        assertEquals(
            dueIdle.copy(request = HoldoutCheckRequest.Waiting(HoldoutCheckAction.Begin)),
            viewModel.state.value,
        )
    }

    @Test
    fun `draws the words the begin answers`() = runTest {
        val viewModel: HoldoutCheckViewModel = reading(firstBandEighthWeekDue)

        viewModel.onIntent(HoldoutCheckIntent.StartTapped)
        holdoutChecks.answerChange(HoldoutCheckChangeResult.Changed(listOf(firstBandEighthWeekAsking)))
        runCurrent()

        assertEquals(listOf(house, walk), askingOf(viewModel).items)
    }

    @Test
    fun `draws the check not open when the begin answers no check of its band and week`() = runTest {
        val viewModel: HoldoutCheckViewModel = reading(firstBandEighthWeekDue)

        viewModel.onIntent(HoldoutCheckIntent.StartTapped)
        holdoutChecks.answerChange(HoldoutCheckChangeResult.Changed(listOf(secondBandTwentyFourthWeekDue)))
        runCurrent()

        assertEquals(HoldoutCheckUiState.NotOpen, viewModel.state.value)
    }

    @Test
    fun `drops a second start while one waits`() = runTest {
        val viewModel: HoldoutCheckViewModel = reading(firstBandEighthWeekDue)

        viewModel.onIntent(HoldoutCheckIntent.StartTapped)
        viewModel.onIntent(HoldoutCheckIntent.StartTapped)
        viewModel.onIntent(HoldoutCheckIntent.SkipTapped)
        runCurrent()

        assertEquals(1, holdoutChecks.changes.size)
    }

    @Test
    fun `skips the check of its band and week when the player skips it`() = runTest {
        val viewModel: HoldoutCheckViewModel = reading(firstBandEighthWeekDue)

        viewModel.onIntent(HoldoutCheckIntent.SkipTapped)
        runCurrent()

        assertEquals(
            listOf(HoldoutCheckChange.Skip(PlacementBand.First, HoldoutCheckWeek.Eighth)),
            holdoutChecks.changes,
        )
    }

    @Test
    fun `draws the skipped line after a skip`() = runTest {
        val viewModel: HoldoutCheckViewModel = reading(firstBandEighthWeekDue)

        viewModel.onIntent(HoldoutCheckIntent.SkipTapped)
        holdoutChecks.answerChange(HoldoutCheckChangeResult.Changed(listOf(secondBandTwentyFourthWeekDue)))
        runCurrent()

        assertEquals(HoldoutCheckUiState.Skipped, viewModel.state.value)
    }

    @Test
    fun `draws the refusal inline on a 409`() = runTest {
        val viewModel: HoldoutCheckViewModel = reading(firstBandEighthWeekDue)

        viewModel.onIntent(HoldoutCheckIntent.StartTapped)
        holdoutChecks.answerChange(HoldoutCheckChangeResult.Refused(HoldoutCheckRefusal.NotOpen))
        runCurrent()

        assertEquals(
            dueIdle.copy(request = HoldoutCheckRequest.Refused(HoldoutCheckAction.Begin, HoldoutCheckRefusal.NotOpen)),
            viewModel.state.value,
        )
    }

    @Test
    fun `draws the outage beside the due check when a skip cannot reach the api`() = runTest {
        val viewModel: HoldoutCheckViewModel = reading(firstBandEighthWeekDue)

        viewModel.onIntent(HoldoutCheckIntent.SkipTapped)
        holdoutChecks.answerChange(HoldoutCheckChangeResult.Unreachable)
        runCurrent()

        assertEquals(dueIdle.copy(request = HoldoutCheckRequest.Unreachable), viewModel.state.value)
    }

    @Test
    fun `shows the next word once the shown word has a meaning chosen`() = runTest {
        val viewModel: HoldoutCheckViewModel = reading(firstBandEighthWeekAsking)

        viewModel.onIntent(HoldoutCheckIntent.ChoiceChosen(houseMeaning))
        viewModel.onIntent(HoldoutCheckIntent.NextTapped)

        assertEquals(walk, askingOf(viewModel).shown)
    }

    @Test
    fun `keeps the shown word while no meaning is chosen`() = runTest {
        val viewModel: HoldoutCheckViewModel = reading(firstBandEighthWeekAsking)

        viewModel.onIntent(HoldoutCheckIntent.NextTapped)

        assertEquals(house, askingOf(viewModel).shown)
    }

    @Test
    fun `keeps the last word shown when the player taps next on it`() = runTest {
        val viewModel: HoldoutCheckViewModel = askingWithEveryWordChosen()

        viewModel.onIntent(HoldoutCheckIntent.NextTapped)

        assertEquals(walk, askingOf(viewModel).shown)
    }

    @Test
    fun `reads nothing again on retry while the check is drawn`() = runTest {
        val viewModel: HoldoutCheckViewModel = reading(firstBandEighthWeekDue)

        viewModel.onIntent(HoldoutCheckIntent.RetryTapped)
        runCurrent()

        assertEquals(1, holdoutChecks.readCount)
    }

    @Test
    fun `sends every answer in one request`() = runTest {
        val viewModel: HoldoutCheckViewModel = askingWithEveryWordChosen()

        viewModel.onIntent(HoldoutCheckIntent.AnswersSent)
        runCurrent()

        assertEquals(
            listOf(
                HoldoutCheckChange.Answer(
                    PlacementBand.First,
                    HoldoutCheckWeek.Eighth,
                    listOf(PlacementAnswer(house.word, houseMeaning), PlacementAnswer(walk.word, walkMeaning)),
                ),
            ),
            holdoutChecks.changes,
        )
    }

    @Test
    fun `sends nothing before the last word`() = runTest {
        val viewModel: HoldoutCheckViewModel = reading(firstBandEighthWeekAsking)
        viewModel.onIntent(HoldoutCheckIntent.ChoiceChosen(houseMeaning))

        viewModel.onIntent(HoldoutCheckIntent.AnswersSent)
        runCurrent()

        assertEquals(emptyList<HoldoutCheckChange>(), holdoutChecks.changes)
    }

    @Test
    fun `sends nothing while the last word has no meaning chosen`() = runTest {
        val viewModel: HoldoutCheckViewModel = reading(firstBandEighthWeekAsking)
        viewModel.onIntent(HoldoutCheckIntent.ChoiceChosen(houseMeaning))
        viewModel.onIntent(HoldoutCheckIntent.NextTapped)

        viewModel.onIntent(HoldoutCheckIntent.AnswersSent)
        runCurrent()

        assertEquals(emptyList<HoldoutCheckChange>(), holdoutChecks.changes)
    }

    @Test
    fun `clears the outage once the player chooses a meaning again`() = runTest {
        val viewModel: HoldoutCheckViewModel = askingWithEveryWordChosen()
        viewModel.onIntent(HoldoutCheckIntent.AnswersSent)
        holdoutChecks.answerChange(HoldoutCheckChangeResult.Unreachable)
        runCurrent()

        viewModel.onIntent(HoldoutCheckIntent.ChoiceChosen(runMeaning))

        assertEquals(HoldoutCheckRequest.Idle, askingOf(viewModel).request)
    }

    @Test
    fun `sends an empty answer list for a check the api asks with no words`() = runTest {
        val viewModel: HoldoutCheckViewModel = reading(firstBandEighthWeekAsking.copy(items = emptyList()))

        viewModel.onIntent(HoldoutCheckIntent.AnswersSent)
        runCurrent()

        assertEquals(
            listOf(HoldoutCheckChange.Answer(PlacementBand.First, HoldoutCheckWeek.Eighth, emptyList())),
            holdoutChecks.changes,
        )
    }

    @Test
    fun `drops a second send while one waits`() = runTest {
        val viewModel: HoldoutCheckViewModel = askingWithEveryWordChosen()

        viewModel.onIntent(HoldoutCheckIntent.AnswersSent)
        viewModel.onIntent(HoldoutCheckIntent.AnswersSent)
        runCurrent()

        assertEquals(1, holdoutChecks.changes.size)
    }

    @Test
    fun `keeps the chosen meanings while the send waits`() = runTest {
        val viewModel: HoldoutCheckViewModel = askingWithEveryWordChosen()

        viewModel.onIntent(HoldoutCheckIntent.AnswersSent)
        viewModel.onIntent(HoldoutCheckIntent.ChoiceChosen(runMeaning))
        runCurrent()

        assertEquals(walkMeaning, askingOf(viewModel).chosenForShown)
    }

    @Test
    fun `draws the done line after the answers`() = runTest {
        val viewModel: HoldoutCheckViewModel = askingWithEveryWordChosen()

        viewModel.onIntent(HoldoutCheckIntent.AnswersSent)
        holdoutChecks.answerChange(HoldoutCheckChangeResult.Changed(emptyList()))
        runCurrent()

        assertEquals(HoldoutCheckUiState.Answered, viewModel.state.value)
    }

    @Test
    fun `draws the refusal beside the words of a refused send`() = runTest {
        val viewModel: HoldoutCheckViewModel = askingWithEveryWordChosen()

        viewModel.onIntent(HoldoutCheckIntent.AnswersSent)
        holdoutChecks.answerChange(HoldoutCheckChangeResult.Refused(HoldoutCheckRefusal.NotOpen))
        runCurrent()

        assertEquals(
            HoldoutCheckRequest.Refused(HoldoutCheckAction.Answers, HoldoutCheckRefusal.NotOpen),
            askingOf(viewModel).request,
        )
    }

    @Test
    fun `keeps the chosen meanings beside a refused send`() = runTest {
        val viewModel: HoldoutCheckViewModel = askingWithEveryWordChosen()

        viewModel.onIntent(HoldoutCheckIntent.AnswersSent)
        holdoutChecks.answerChange(HoldoutCheckChangeResult.Refused(HoldoutCheckRefusal.NotOpen))
        runCurrent()

        assertEquals(walkMeaning, askingOf(viewModel).chosenForShown)
    }

    @Test
    fun `draws the invalid request beside the words when the api cannot take the answers`() = runTest {
        val viewModel: HoldoutCheckViewModel = askingWithEveryWordChosen()

        viewModel.onIntent(HoldoutCheckIntent.AnswersSent)
        holdoutChecks.answerChange(HoldoutCheckChangeResult.Refused(HoldoutCheckRefusal.InvalidRequest))
        runCurrent()

        assertEquals(
            HoldoutCheckRequest.Refused(HoldoutCheckAction.Answers, HoldoutCheckRefusal.InvalidRequest),
            askingOf(viewModel).request,
        )
    }

    @Test
    fun `draws the outage beside the words when the send cannot reach the api`() = runTest {
        val viewModel: HoldoutCheckViewModel = askingWithEveryWordChosen()

        viewModel.onIntent(HoldoutCheckIntent.AnswersSent)
        holdoutChecks.answerChange(HoldoutCheckChangeResult.Unreachable)
        runCurrent()

        assertEquals(HoldoutCheckRequest.Unreachable, askingOf(viewModel).request)
    }

    @Test
    fun `sends again after an outage`() = runTest {
        val viewModel: HoldoutCheckViewModel = askingWithEveryWordChosen()
        viewModel.onIntent(HoldoutCheckIntent.AnswersSent)
        holdoutChecks.answerChange(HoldoutCheckChangeResult.Unreachable)
        runCurrent()

        viewModel.onIntent(HoldoutCheckIntent.AnswersSent)
        runCurrent()

        assertEquals(2, holdoutChecks.changes.size)
    }
}
