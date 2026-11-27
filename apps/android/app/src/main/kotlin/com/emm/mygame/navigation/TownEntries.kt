package com.emm.mygame.navigation

import androidx.compose.runtime.Composable
import androidx.navigation3.runtime.EntryProviderScope
import androidx.navigation3.runtime.NavKey
import com.emm.mygame.AppDependencies
import com.emm.mygame.Destination
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.feature.shell.FrameKind
import com.emm.mygame.feature.shell.bar.Tab
import com.emm.mygame.feature.shell.ring.RetainedWordsRing
import com.emm.mygame.feature.town.TownNavigation
import com.emm.mygame.feature.town.TownRoute

internal fun EntryProviderScope<NavKey>.townEntry(dependencies: AppDependencies, navigator: Navigator) {
    entry<Destination.Town> { TownHome(dependencies = dependencies, navigator = navigator) }
}

internal fun EntryProviderScope<NavKey>.namingEntry(dependencies: AppDependencies, navigator: Navigator) {
    entry<Destination.Naming> { TownHome(dependencies = dependencies, navigator = navigator) }
}

internal fun EntryProviderScope<NavKey>.placeEntry(dependencies: AppDependencies, navigator: Navigator) {
    entry<Destination.Place> { shown: Destination.Place ->
        SignedInFrame(kind = FrameKind.Place, dependencies = dependencies, navigator = navigator) {
            TownRoute(
                towns = dependencies.towns,
                clock = dependencies.clock,
                navigation = townNavigationOf(navigator),
                place = shown.building,
            )
        }
    }
}

@Composable
private fun TownHome(dependencies: AppDependencies, navigator: Navigator) {
    SignedInFrame(kind = FrameKind.Home, dependencies = dependencies, navigator = navigator) {
        TownRoute(
            towns = dependencies.towns,
            clock = dependencies.clock,
            navigation = townNavigationOf(navigator),
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
