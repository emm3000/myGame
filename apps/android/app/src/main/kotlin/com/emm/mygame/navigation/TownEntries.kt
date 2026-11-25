package com.emm.mygame.navigation

import androidx.compose.runtime.State
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation3.runtime.EntryProviderScope
import androidx.navigation3.runtime.NavKey
import com.emm.mygame.AppDependencies
import com.emm.mygame.Destination
import com.emm.mygame.FrameKind
import com.emm.mygame.RetainedWordsRing
import com.emm.mygame.ScreenFrame
import com.emm.mygame.SignedInChrome
import com.emm.mygame.core.model.learning.TextId
import com.emm.mygame.feature.placement.PlacementOfferRoute
import com.emm.mygame.feature.town.TownNavigation
import com.emm.mygame.feature.town.TownRoute
import com.emm.mygame.feature.town.TownUiState
import com.emm.mygame.feature.town.TownViewModel

internal fun EntryProviderScope<NavKey>.townEntry(chrome: SignedInChrome) {
    townHomeEntry<Destination.Town>(chrome)
}

internal fun EntryProviderScope<NavKey>.namingEntry(chrome: SignedInChrome) {
    townHomeEntry<Destination.Naming>(chrome)
}

private inline fun <reified Shown : NavKey> EntryProviderScope<NavKey>.townHomeEntry(chrome: SignedInChrome) {
    val dependencies: AppDependencies = chrome.dependencies
    val navigator: Navigator = chrome.navigator
    entry<Shown> {
        val town: TownViewModel = viewModel {
            TownViewModel(dependencies.towns, dependencies.sessions, dependencies.clock)
        }
        val townState: State<TownUiState> = town.state.collectAsStateWithLifecycle()
        SignedInFrame(
            kind = FrameKind.Home,
            doesScreenReadTown = true,
            chrome = chrome,
            isDockWithheld = townState.value.isDockWithheld,
        ) { frame: ScreenFrame ->
            TownRoute(
                towns = dependencies.towns,
                sessions = dependencies.sessions,
                clock = dependencies.clock,
                viewModel = town,
                navigation = TownNavigation(
                    onSchoolOpen = { navigator.openTab(Tab.Learn) },
                    onMapOpen = { navigator.openOnTab(Destination.Map) },
                    onTextOpen = { text: TextId ->
                        navigator.openAbove(Destination.Town, Destination.SchoolText(text))
                    },
                    onSigningOut = navigator::signingOut,
                    onSignedOut = { navigator.signedOut(isSessionEnded = false) },
                    onUnnamed = navigator::townUnnamed,
                    onNamed = navigator::townNamed,
                ),
                ring = { RetainedWordsRing(towns = dependencies.towns, doesScreenReadTown = true) },
                status = frame.status,
                foldedDock = frame.foldedDock,
                reportRow = frame.reportRow,
                placement = {
                    PlacementOfferRoute(
                        placements = dependencies.placements,
                        onPlacementOpen = { navigator.openOnTab(Destination.Placement) },
                    )
                },
            )
        }
    }
}
