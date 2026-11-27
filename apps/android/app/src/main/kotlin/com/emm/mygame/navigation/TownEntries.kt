package com.emm.mygame.navigation

import androidx.compose.runtime.Composable
import androidx.navigation3.runtime.EntryProviderScope
import androidx.navigation3.runtime.NavKey
import com.emm.mygame.AppDependencies
import com.emm.mygame.Destination
import com.emm.mygame.FrameKind
import com.emm.mygame.SignedInChrome
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.feature.shell.bar.Tab
import com.emm.mygame.feature.shell.ring.RetainedWordsRing
import com.emm.mygame.feature.town.TownNavigation
import com.emm.mygame.feature.town.TownRoute

internal fun EntryProviderScope<NavKey>.townEntry(chrome: SignedInChrome) {
    entry<Destination.Town> { TownHome(chrome = chrome) }
}

internal fun EntryProviderScope<NavKey>.namingEntry(chrome: SignedInChrome) {
    entry<Destination.Naming> { TownHome(chrome = chrome) }
}

internal fun EntryProviderScope<NavKey>.placeEntry(chrome: SignedInChrome) {
    entry<Destination.Place> { shown: Destination.Place ->
        SignedInFrame(kind = FrameKind.Place, chrome = chrome) {
            TownRoute(
                towns = chrome.dependencies.towns,
                clock = chrome.dependencies.clock,
                navigation = townNavigationOf(chrome.navigator),
                place = shown.building,
            )
        }
    }
}

@Composable
private fun TownHome(chrome: SignedInChrome) {
    val dependencies: AppDependencies = chrome.dependencies
    SignedInFrame(kind = FrameKind.Home, chrome = chrome) {
        TownRoute(
            towns = dependencies.towns,
            clock = dependencies.clock,
            navigation = townNavigationOf(chrome.navigator),
            place = null,
            ring = { RetainedWordsRing(towns = dependencies.towns, doesScreenReadTown = true) },
        )
    }
}

private fun townNavigationOf(navigator: Navigator): TownNavigation = TownNavigation(
    onPlaceOpen = { building: TownBuildingKind ->
        navigator.openAbove(Destination.Town, Destination.Place(building))
    },
    onNewsOpen = { navigator.openAbove(Destination.Town, Destination.News) },
    onSchoolOpen = { navigator.openTab(Tab.Learn) },
    onMapOpen = { navigator.openOnTab(Destination.Map) },
    onUnnamed = navigator::townUnnamed,
    onNamed = navigator::townNamed,
)
