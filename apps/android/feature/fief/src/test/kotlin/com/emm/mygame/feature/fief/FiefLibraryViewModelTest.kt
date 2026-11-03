package com.emm.mygame.feature.fief

import app.cash.turbine.test
import com.emm.mygame.core.network.ArtKind
import com.emm.mygame.core.network.ArtState
import com.emm.mygame.core.network.FiefId
import com.emm.mygame.core.network.FiefReadResult
import com.emm.mygame.core.network.FiefSnapshot
import com.emm.mygame.core.network.ResourceCost
import com.emm.mygame.core.network.ResourceKind
import com.emm.mygame.core.network.StoredResource
import com.emm.mygame.core.network.StudyRefusal
import com.emm.mygame.core.network.StudyResult
import com.emm.mygame.core.network.StudySlot
import com.emm.mygame.core.testing.FakeFiefRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
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
                        ratePercent = 10.0,
                        next = FiefUiState.NextArtLine(
                            level = 3,
                            ratePercent = 15.0,
                            costs = listOf(
                                FiefUiState.CostLine(ResourceKind.Wood, 120, isShort = false),
                                FiefUiState.CostLine(ResourceKind.Stone, 80, isShort = true),
                                FiefUiState.CostLine(ResourceKind.Iron, 150, isShort = true),
                                FiefUiState.CostLine(ResourceKind.Gold, 60, isShort = true),
                            ),
                            duration = 30.minutes,
                            requiredLibraryLevel = 2,
                            isLibraryTooLow = true,
                            block = FiefUiState.StudyBlock.LibraryTooLow(required = 2, built = 1),
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
    fun `counts the busy study down to its finish with the refund of the cost it debited`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        val debited: List<ResourceCost> = listOf(
            ResourceCost(ResourceKind.Wood, 100),
            ResourceCost(ResourceKind.Stone, 70),
            ResourceCost(ResourceKind.Iron, 130),
            ResourceCost(ResourceKind.Gold, 50),
            ResourceCost(ResourceKind.Food, 0),
        )
        val studying: StudySlot = studyingSmithing(targetLevel = 1, finishesIn = 30.minutes, cost = debited)
        val read: FiefSnapshot = fief(buildings = listOf(library(level = 1)), study = studying)
        fiefs.answerRead(FiefReadResult.Read(read))

        viewModel.state.test {
            assertNotEquals(debited, read.arts.first { art: ArtState -> art.kind == ArtKind.Smithing }.nextLevel?.cost)
            assertEquals(
                FiefUiState.StudySlotLine.Busy(
                    art = ArtKind.Smithing,
                    targetLevel = 1,
                    remaining = 30.minutes,
                    refund = listOf(
                        ResourceCost(ResourceKind.Wood, 100),
                        ResourceCost(ResourceKind.Stone, 70),
                        ResourceCost(ResourceKind.Iron, 130),
                        ResourceCost(ResourceKind.Gold, 50),
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

    @Test
    fun `keeps the fraction of an art's rate`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        val fractionalSmithing: ArtState = smithing(level = 1).let { art: ArtState ->
            art.copy(ratePercent = 7.5, nextLevel = art.nextLevel?.copy(ratePercent = 12.5))
        }
        fiefs.answerRead(
            FiefReadResult.Read(fief(buildings = listOf(library(level = 1)), arts = listOf(fractionalSmithing))),
        )

        viewModel.state.test {
            val card: FiefUiState.ArtCard? = awaitContent().library?.arts?.single()
            assertEquals(7.5, card?.ratePercent ?: 0.0, 0.0)
            assertEquals(12.5, card?.next?.ratePercent ?: 0.0, 0.0)
        }
    }

    @Test
    fun `blocks a study while another is under way`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        val studying: StudySlot = studyingSmithing(targetLevel = 1, finishesIn = 30.minutes)
        val lowLibrary: FiefSnapshot = fief(
            buildings = listOf(library(level = 1)),
            study = studying,
            arts = listOf(smithing(level = 0, requiredLibraryLevel = 2)),
        )
        fiefs.answerRead(FiefReadResult.Read(lowLibrary))

        viewModel.state.test {
            assertEquals(FiefUiState.StudyBlock.StudyRunning, awaitContent().smithingBlock())
        }
    }

    @Test
    fun `blocks a study while the library is below the level it requires`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        val lowLibrary: FiefSnapshot = fief(
            buildings = listOf(library(level = 1)),
            arts = listOf(smithing(level = 0, requiredLibraryLevel = 2)),
        )
        fiefs.answerRead(FiefReadResult.Read(lowLibrary))

        viewModel.state.test {
            assertEquals(FiefUiState.StudyBlock.LibraryTooLow(required = 2, built = 1), awaitContent().smithingBlock())
        }
    }

    @Test
    fun `blocks a study for the resources short at the drawn amounts`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        val growingWood: StoredResource = wood(amount = 90, ratePerHour = 1800.0)
        val shortStores: FiefSnapshot = fief(
            resources = listOf(growingWood, stored(ResourceKind.Stone, 80), stored(ResourceKind.Iron, 100)),
            buildings = listOf(library(level = 1)),
            arts = listOf(smithing(level = 0)),
        )
        fiefs.answerRead(FiefReadResult.Read(shortStores))

        viewModel.state.test {
            awaitContent()
            advanceTimeBy(1.minutes)
            runCurrent()
            assertEquals(
                FiefUiState.BlockReason.Resources(
                    listOf(
                        FiefUiState.Shortfall(ResourceKind.Iron, 50),
                        FiefUiState.Shortfall(ResourceKind.Gold, 60),
                    ),
                ),
                awaitContent().smithingBlock(),
            )
        }
    }

    @Test
    fun `leaves a study unblocked when nothing stands in its way`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        val fullStores: FiefSnapshot = fief(
            resources = ResourceKind.entries.map { kind: ResourceKind -> stored(kind, 500) },
            buildings = listOf(library(level = 1)),
            arts = listOf(smithing(level = 0)),
        )
        fiefs.answerRead(FiefReadResult.Read(fullStores))

        viewModel.state.test {
            assertNull(awaitContent().smithingBlock())
        }
    }

    @Test
    fun `sends a blocked study anyway`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        val studying: StudySlot = studyingSmithing(targetLevel = 1, finishesIn = 1.hours)
        fiefs.answerRead(FiefReadResult.Read(fief(buildings = listOf(library(level = 1)), study = studying)))

        viewModel.state.test {
            assertEquals(FiefUiState.StudyBlock.StudyRunning, awaitContent().smithingBlock())
            viewModel.onIntent(FiefIntent.StudyTapped(ArtKind.Smithing))
            awaitContentWhere { it.library?.study == FiefUiState.StudyStatus.Waiting }
        }
        assertEquals(listOf(FakeFiefRepository.StudyRequest.Start(FiefId(FIEF_ID), ArtKind.Smithing)), fiefs.studies)
    }

    private fun FiefUiState.Content.smithingBlock(): FiefUiState.StudyBlock? =
        library?.arts?.first { card: FiefUiState.ArtCard -> card.kind == ArtKind.Smithing }?.next?.block

    private fun stored(kind: ResourceKind, amount: Long): StoredResource =
        StoredResource(kind, amount = amount, ratePerHour = 0.0, capacity = 1000)
}
