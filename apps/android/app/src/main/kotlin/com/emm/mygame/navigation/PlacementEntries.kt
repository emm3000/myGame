package com.emm.mygame.navigation

import androidx.navigation3.runtime.EntryProviderScope
import androidx.navigation3.runtime.NavKey
import com.emm.mygame.AppDependencies
import com.emm.mygame.Destination
import com.emm.mygame.FrameKind
import com.emm.mygame.ScreenFrame
import com.emm.mygame.SignedInChrome
import com.emm.mygame.feature.placement.HoldoutCheckRoute
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

internal fun EntryProviderScope<NavKey>.holdoutCheckEntry(chrome: SignedInChrome) {
    val dependencies: AppDependencies = chrome.dependencies
    entry<Destination.HoldoutCheck> { check: Destination.HoldoutCheck ->
        SignedInFrame(
            kind = FrameKind.Task,
            doesScreenReadTown = false,
            chrome = chrome,
        ) { frame: ScreenFrame ->
            HoldoutCheckRoute(
                holdoutChecks = dependencies.holdoutChecks,
                band = check.band,
                week = check.week,
                hook = frame.task,
                foldedDock = frame.foldedDock,
            )
        }
    }
}
