package com.emm.mygame.navigation

import androidx.navigation3.runtime.EntryProviderScope
import androidx.navigation3.runtime.NavKey
import com.emm.mygame.AppDependencies
import com.emm.mygame.Destination
import com.emm.mygame.FrameKind
import com.emm.mygame.ScreenFrame
import com.emm.mygame.SignedInChrome
import com.emm.mygame.feature.placement.PlacementRoute

internal fun EntryProviderScope<NavKey>.placementEntry(chrome: SignedInChrome) {
    val dependencies: AppDependencies = chrome.dependencies
    entry<Destination.Placement> {
        SignedInFrame(
            kind = FrameKind.Task,
            doesScreenReadTown = false,
            chrome = chrome,
        ) { frame: ScreenFrame ->
            PlacementRoute(
                placements = dependencies.placements,
                hook = frame.task,
                foldedDock = frame.foldedDock,
            )
        }
    }
}
