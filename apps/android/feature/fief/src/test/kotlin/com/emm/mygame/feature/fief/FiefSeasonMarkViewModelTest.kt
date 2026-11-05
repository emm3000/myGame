package com.emm.mygame.feature.fief

import app.cash.turbine.test
import com.emm.mygame.core.network.FiefReadResult
import com.emm.mygame.core.network.FiefSnapshot
import com.emm.mygame.core.network.ResourceKind
import com.emm.mygame.core.network.SeasonInForce
import com.emm.mygame.core.network.SeasonKind
import com.emm.mygame.core.network.SeasonPercents
import com.emm.mygame.core.network.StoredResource
import com.emm.mygame.core.testing.FakeFiefRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlin.time.Duration.Companion.days
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class FiefSeasonMarkViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    @Test
    fun `marks the resource the season raises with its change from the neutral rate`() = runTest {
        val viewModel: FiefViewModel = openOn(seasonal(SeasonKind.Fall, ResourceKind.Gold to 125))

        viewModel.state.test {
            val mark: FiefUiState.SeasonMark? = markOf(awaitContent(), ResourceKind.Gold)
            assertEquals(FiefUiState.SeasonMark(SeasonKind.Fall, change = 25), mark)
        }
    }

    @Test
    fun `marks the resource the season lowers with its change from the neutral rate`() = runTest {
        val viewModel: FiefViewModel = openOn(seasonal(SeasonKind.Winter, ResourceKind.Food to 75))

        viewModel.state.test {
            val mark: FiefUiState.SeasonMark? = markOf(awaitContent(), ResourceKind.Food)
            assertEquals(FiefUiState.SeasonMark(SeasonKind.Winter, change = -25), mark)
        }
    }

    @Test
    fun `marks no resource left at the neutral rate`() = runTest {
        val viewModel: FiefViewModel = openOn(seasonal(SeasonKind.Spring, ResourceKind.Food to 125))

        viewModel.state.test {
            assertEquals(listOf(ResourceKind.Food), markedKindsOf(awaitContent()))
        }
    }

    @Test
    fun `marks no resource in summer`() = runTest {
        val viewModel: FiefViewModel = openOn(seasonal(SeasonKind.Summer))

        viewModel.state.test {
            assertEquals(emptyList<ResourceKind>(), markedKindsOf(awaitContent()))
        }
    }

    @Test
    fun `marks no resource while the overview carries no season`() = runTest {
        val viewModel: FiefViewModel = openOn(
            fief(resources = ResourceKind.entries.map { resource: ResourceKind -> stored(resource) }),
        )

        viewModel.state.test {
            assertEquals(emptyList<ResourceKind>(), markedKindsOf(awaitContent()))
        }
    }

    private fun markedKindsOf(content: FiefUiState.Content): List<ResourceKind> = content.resources
        .filter { line: FiefUiState.ResourceLine -> line.seasonMark != null }
        .map { line: FiefUiState.ResourceLine -> line.kind }

    private fun markOf(content: FiefUiState.Content, kind: ResourceKind): FiefUiState.SeasonMark? =
        content.resources.single { line: FiefUiState.ResourceLine -> line.kind == kind }.seasonMark

    private fun TestScope.openOn(read: FiefSnapshot): FiefViewModel {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(read))
        return viewModel
    }

    private fun seasonal(kind: SeasonKind, vararg changed: Pair<ResourceKind, Int>): FiefSnapshot = fief(
        resources = ResourceKind.entries.map { resource: ResourceKind -> stored(resource) },
        season = SeasonPercents(road = 100, loot = neutralRates() + changed),
        seasonInForce = SeasonInForce(kind = kind, year = 1),
        seasonEndsAt = firstReadAt + 3.days,
    )

    private fun neutralRates(): Map<ResourceKind, Int> = ResourceKind.entries.associateWith { 100 }

    private fun stored(kind: ResourceKind): StoredResource =
        StoredResource(kind, amount = 500, ratePerHour = 60.0, capacity = 1000)
}
