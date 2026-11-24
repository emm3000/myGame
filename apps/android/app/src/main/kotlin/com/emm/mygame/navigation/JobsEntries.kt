package com.emm.mygame.navigation

import androidx.navigation3.runtime.EntryProviderScope
import androidx.navigation3.runtime.NavKey
import com.emm.mygame.AppDependencies
import com.emm.mygame.Destination
import com.emm.mygame.FrameKind
import com.emm.mygame.ScreenFrame
import com.emm.mygame.SignedInChrome
import com.emm.mygame.feature.jobs.MapRoute

internal fun EntryProviderScope<NavKey>.jobsEntry(chrome: SignedInChrome) {
    val dependencies: AppDependencies = chrome.dependencies
    val navigator: Navigator = chrome.navigator
    entry<Destination.Map> {
        SignedInFrame(
            kind = FrameKind.Place,
            doesScreenReadTown = true,
            chrome = chrome,
        ) { frame: ScreenFrame ->
            MapRoute(
                towns = dependencies.towns,
                clock = dependencies.clock,
                onNoTown = navigator::openTown,
                foldedDock = frame.foldedDock,
            )
        }
    }
}
