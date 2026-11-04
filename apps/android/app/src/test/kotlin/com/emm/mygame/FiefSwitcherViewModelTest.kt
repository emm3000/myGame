package com.emm.mygame

import com.emm.mygame.core.network.FiefAddress
import com.emm.mygame.core.network.FiefId
import com.emm.mygame.core.network.FiefListResult
import com.emm.mygame.core.network.FreeSlot
import com.emm.mygame.core.network.ListedFief
import com.emm.mygame.core.network.ResourceKind
import com.emm.mygame.core.testing.FakeFiefListRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class FiefSwitcherViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val onScreen: FiefId = FiefId("7c1f0a52-3d4e-4b8a-9f61-2e5d8c0b4a17")

    private val other: FiefId = FiefId("509eadd5-6b34-4ea3-8e91-2b38744bd385")

    private val founded: FiefId = FiefId("1d2e3f40-5a6b-4c7d-8e9f-0a1b2c3d4e5f")

    private val listedOther: ListedFief = ListedFief(
        id = other,
        name = "Páramo",
        address = FiefAddress(kingdom = 1, province = 2, plot = 7),
        freeSlots = listOf(FreeSlot.Build, FreeSlot.March),
        fullStores = listOf(ResourceKind.Stone),
    )

    private val listedOnScreen: ListedFief = ListedFief(
        id = onScreen,
        name = "Sotoverde",
        address = FiefAddress(kingdom = 1, province = 3, plot = 12),
        freeSlots = listOf(FreeSlot.Study),
        fullStores = listOf(ResourceKind.Wood),
    )

    private val listedFounded: ListedFief =
        listedOther.copy(id = founded, name = "Vega", address = FiefAddress(1, 4, 2))

    private val twoFiefs: FiefListResult = FiefListResult.Listed(listOf(listedOther, listedOnScreen))

    @Test
    fun `draws no switcher before the list is read`() = runTest {
        val viewModel: FiefSwitcherViewModel = FiefSwitcherViewModel(onScreen, FakeFiefListRepository())

        assertEquals(FiefSwitcherUiState.Unlisted, viewModel.state.value)
    }

    @Test
    fun `lists every fief in the api's order with its name and address`() = runTest {
        val viewModel: FiefSwitcherViewModel = shownWith(twoFiefs)

        assertEquals(
            listOf("Páramo" to FiefAddress(1, 2, 7), "Sotoverde" to FiefAddress(1, 3, 12)),
            entriesOf(viewModel).map { entry: FiefSwitcherUiState.Entry -> entry.name to entry.address },
        )
    }

    @Test
    fun `marks the fief on screen as the current one`() = runTest {
        val viewModel: FiefSwitcherViewModel = shownWith(twoFiefs)

        assertEquals(
            listOf(other to false, onScreen to true),
            entriesOf(viewModel).map { entry: FiefSwitcherUiState.Entry -> entry.fief to entry.isCurrent },
        )
    }

    @Test
    fun `draws no badge on the fief on screen`() = runTest {
        val viewModel: FiefSwitcherViewModel = shownWith(twoFiefs)

        assertEquals(emptyList<FiefSwitcherUiState.Badge>(), entriesOf(viewModel).last().badges)
    }

    @Test
    fun `draws each free slot and then each full store as a badge on another fief`() = runTest {
        val viewModel: FiefSwitcherViewModel = shownWith(twoFiefs)

        assertEquals(
            listOf(
                FiefSwitcherUiState.Badge.Idle(FreeSlot.Build),
                FiefSwitcherUiState.Badge.Idle(FreeSlot.March),
                FiefSwitcherUiState.Badge.FullStore(ResourceKind.Stone),
            ),
            entriesOf(viewModel).first().badges,
        )
    }

    @Test
    fun `reads the list again each time the screen is shown`() = runTest {
        val listings: FakeFiefListRepository = FakeFiefListRepository()
        val viewModel: FiefSwitcherViewModel = FiefSwitcherViewModel(onScreen, listings)
        viewModel.onIntent(FiefSwitcherIntent.ScreenShown)
        listings.answerListed(twoFiefs)

        viewModel.onIntent(FiefSwitcherIntent.ScreenShown)

        assertEquals(2, listings.listedCount)
    }

    @Test
    fun `lists the founded fief once a founding is applied`() = runTest {
        val listings: FakeFiefListRepository = FakeFiefListRepository()
        val viewModel: FiefSwitcherViewModel = FiefSwitcherViewModel(onScreen, listings)
        viewModel.onIntent(FiefSwitcherIntent.ScreenShown)
        listings.answerListed(twoFiefs)

        viewModel.onIntent(FiefSwitcherIntent.FoundingApplied)
        listings.answerListed(FiefListResult.Listed(listOf(listedOther, listedOnScreen, listedFounded)))

        assertEquals(
            listOf(other, onScreen, founded),
            entriesOf(viewModel).map { entry: FiefSwitcherUiState.Entry -> entry.fief },
        )
    }

    @Test
    fun `keeps the last entries when a list read fails`() = runTest {
        val listings: FakeFiefListRepository = FakeFiefListRepository()
        val viewModel: FiefSwitcherViewModel = FiefSwitcherViewModel(onScreen, listings)
        viewModel.onIntent(FiefSwitcherIntent.ScreenShown)
        listings.answerListed(twoFiefs)
        val listed: FiefSwitcherUiState = viewModel.state.value

        viewModel.onIntent(FiefSwitcherIntent.ScreenShown)
        listings.answerListed(FiefListResult.Unreachable)

        assertEquals(listed, viewModel.state.value)
    }

    @Test
    fun `draws no switcher when no list read succeeded`() = runTest {
        val viewModel: FiefSwitcherViewModel = shownWith(FiefListResult.Unreachable)

        assertEquals(FiefSwitcherUiState.Unlisted, viewModel.state.value)
    }

    private fun shownWith(answer: FiefListResult): FiefSwitcherViewModel {
        val listings: FakeFiefListRepository = FakeFiefListRepository()
        val viewModel: FiefSwitcherViewModel = FiefSwitcherViewModel(onScreen, listings)
        viewModel.onIntent(FiefSwitcherIntent.ScreenShown)
        listings.answerListed(answer)
        return viewModel
    }

    private fun entriesOf(viewModel: FiefSwitcherViewModel): List<FiefSwitcherUiState.Entry> =
        (viewModel.state.value as FiefSwitcherUiState.Listed).entries
}
