package com.emm.mygame.feature.fief

import app.cash.turbine.test
import com.emm.mygame.core.network.ArtKind
import com.emm.mygame.core.network.FiefId
import com.emm.mygame.core.network.FiefReadResult
import com.emm.mygame.core.network.ResourceCost
import com.emm.mygame.core.network.ResourceKind
import com.emm.mygame.core.network.StudyRefusal
import com.emm.mygame.core.network.StudyResult
import com.emm.mygame.core.network.StudySlot
import com.emm.mygame.core.testing.FakeFiefRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Rule
import org.junit.Test

class FiefLibraryViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    @Test
    fun `hides the library section below library level 1`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(fief(buildings = listOf(library(level = 0)))))

        viewModel.state.test {
            assertNull(awaitContent().library)
        }
    }

    @Test
    fun `draws an idle study slot from library level 1`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(fief(buildings = listOf(library(level = 1)))))

        viewModel.state.test {
            assertEquals(FiefUiState.StudySlotLine.Idle, awaitContent().library?.slot)
        }
    }

    @Test
    fun `draws each art with its level, rate and next level`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        val readyLibrary: FiefReadResult = FiefReadResult.Read(
            fief(buildings = listOf(library(level = 1)), arts = listOf(smithing(level = 2, requiredLibraryLevel = 2))),
        )
        fiefs.answerRead(readyLibrary)

        viewModel.state.test {
            assertEquals(
                listOf(
                    FiefUiState.ArtCard(
                        kind = ArtKind.Smithing,
                        level = 2,
                        resource = ResourceKind.Iron,
                        ratePercent = 10,
                        next = FiefUiState.NextArtLine(
                            level = 3,
                            ratePercent = 15,
                            costs = listOf(
                                FiefUiState.CostLine(ResourceKind.Wood, 120, isShort = false),
                                FiefUiState.CostLine(ResourceKind.Stone, 80, isShort = true),
                                FiefUiState.CostLine(ResourceKind.Iron, 150, isShort = true),
                                FiefUiState.CostLine(ResourceKind.Gold, 60, isShort = true),
                            ),
                            duration = 30.minutes,
                            requiredLibraryLevel = 2,
                            isLibraryTooLow = true,
                        ),
                    ),
                ),
                awaitContent().library?.arts,
            )
        }
    }

    @Test
    fun `posts one study while the first one waits`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(fief(buildings = listOf(library(level = 1)))))

        viewModel.state.test {
            awaitContent()
            viewModel.onIntent(FiefIntent.StudyTapped(ArtKind.Smithing))
            viewModel.onIntent(FiefIntent.StudyTapped(ArtKind.Smithing))
            assertEquals(FiefUiState.StudyStatus.Waiting, awaitContent().library?.study)
        }
        assertEquals(listOf(FakeFiefRepository.StudyRequest.Start(FiefId(FIEF_ID), ArtKind.Smithing)), fiefs.studies)
    }

    @Test
    fun `draws the study the api answers`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(fief(buildings = listOf(library(level = 1)))))
        val studying: StudySlot = studyingSmithing(targetLevel = 1, finishesIn = 30.minutes)
        fiefs.answerStudy(StudyResult.Answered(fief(buildings = listOf(library(level = 1)), study = studying)))

        viewModel.state.test {
            awaitContent()
            viewModel.onIntent(FiefIntent.StudyTapped(ArtKind.Smithing))
            val answered: FiefUiState.Content = awaitContentWhere { it.library?.slot is FiefUiState.StudySlotLine.Busy }
            assertEquals(FiefUiState.StudyStatus.Idle, answered.library?.study)
        }
        assertEquals(1, fiefs.readCount)
    }

    @Test
    fun `counts the busy study down to its finish with the refund of its cost`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        val studying: StudySlot = studyingSmithing(targetLevel = 1, finishesIn = 30.minutes)
        fiefs.answerRead(FiefReadResult.Read(fief(buildings = listOf(library(level = 1)), study = studying)))

        viewModel.state.test {
            assertEquals(
                FiefUiState.StudySlotLine.Busy(
                    art = ArtKind.Smithing,
                    targetLevel = 1,
                    remaining = 30.minutes,
                    refund = listOf(
                        ResourceCost(ResourceKind.Wood, 120),
                        ResourceCost(ResourceKind.Stone, 80),
                        ResourceCost(ResourceKind.Iron, 150),
                        ResourceCost(ResourceKind.Gold, 60),
                    ),
                ),
                awaitContent().library?.slot,
            )
        }
    }

    @Test
    fun `re-reads the fief when the study finishes`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        val studying: StudySlot = studyingSmithing(targetLevel = 1, finishesIn = 2.seconds)
        fiefs.answerRead(FiefReadResult.Read(fief(buildings = listOf(library(level = 1)), study = studying)))
        val finished: FiefReadResult =
            FiefReadResult.Read(fief(buildings = listOf(library(level = 1)), readAt = firstReadAt + 2.seconds))
        fiefs.answerRead(finished)

        viewModel.state.test {
            awaitContent()
            assertEquals(1, fiefs.readCount)
            advanceTimeBy(2.seconds)
            runCurrent()
            awaitContentWhere { it.library?.slot == FiefUiState.StudySlotLine.Idle }
        }
        assertEquals(2, fiefs.readCount)
    }

    @Test
    fun `cancels the study naming its art and level`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        val studying: StudySlot = studyingSmithing(targetLevel = 3, finishesIn = 30.minutes)
        fiefs.answerRead(FiefReadResult.Read(fief(buildings = listOf(library(level = 1)), study = studying)))
        fiefs.answerStudy(StudyResult.Answered(fief(buildings = listOf(library(level = 1)))))

        viewModel.state.test {
            awaitContent()
            viewModel.onIntent(FiefIntent.StudyCancelTapped(ArtKind.Smithing, targetLevel = 3))
            awaitContentWhere { it.library?.slot == FiefUiState.StudySlotLine.Idle }
        }
        assertEquals(
            listOf(FakeFiefRepository.StudyRequest.Cancel(FiefId(FIEF_ID), ArtKind.Smithing, targetLevel = 3)),
            fiefs.studies,
        )
    }

    @Test
    fun `re-reads the fief when the cancel names a finished study`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        val studying: StudySlot = studyingSmithing(targetLevel = 1, finishesIn = 30.minutes)
        fiefs.answerRead(FiefReadResult.Read(fief(buildings = listOf(library(level = 1)), study = studying)))
        fiefs.answerStudy(StudyResult.Refused(StudyRefusal.StudyNotFound))
        fiefs.answerRead(FiefReadResult.Read(fief(buildings = listOf(library(level = 1)))))

        viewModel.state.test {
            awaitContent()
            viewModel.onIntent(FiefIntent.StudyCancelTapped(ArtKind.Smithing, targetLevel = 1))
            val reread: FiefUiState.Content = awaitContentWhere { it.library?.slot == FiefUiState.StudySlotLine.Idle }
            assertEquals(FiefUiState.StudyStatus.Refused(StudyRefusal.StudyNotFound), reread.library?.study)
        }
        assertEquals(2, fiefs.readCount)
    }

    @Test
    fun `keeps the refusal the api names beside the library`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(fief(buildings = listOf(library(level = 1)))))
        fiefs.answerStudy(StudyResult.Refused(StudyRefusal.LibraryLevelTooLow))

        viewModel.state.test {
            awaitContent()
            viewModel.onIntent(FiefIntent.StudyTapped(ArtKind.Smithing))
            assertEquals(
                FiefUiState.StudyStatus.Refused(StudyRefusal.LibraryLevelTooLow),
                awaitContentWhere { it.library?.study is FiefUiState.StudyStatus.Refused }.library?.study,
            )
        }
    }

    @Test
    fun `tells the lord the study could not reach the api`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(fief(buildings = listOf(library(level = 1)))))
        fiefs.answerStudy(StudyResult.Unreachable)

        viewModel.state.test {
            awaitContent()
            viewModel.onIntent(FiefIntent.StudyTapped(ArtKind.Masonry))
            assertEquals(
                FiefUiState.StudyStatus.Unreachable,
                awaitContentWhere { it.library?.study == FiefUiState.StudyStatus.Unreachable }.library?.study,
            )
        }
    }
}
