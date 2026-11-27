package com.emm.mygame.navigation

import androidx.navigation3.runtime.EntryProviderScope
import androidx.navigation3.runtime.NavKey
import com.emm.mygame.AppDependencies
import com.emm.mygame.Destination
import com.emm.mygame.FrameKind
import com.emm.mygame.SignedInChrome
import com.emm.mygame.feature.placement.PlacementRoute

internal fun EntryProviderScope<NavKey>.placementEntry(chrome: SignedInChrome) {
    val dependencies: AppDependencies = chrome.dependencies
    entry<Destination.Placement> {
        SignedInFrame(
            kind = FrameKind.Task,
            chrome = chrome,
        ) {
            PlacementRoute(
                placements = dependencies.placements,
                onEnd = chrome.onTaskAnswered,
                onDone = chrome.navigator::back,
            )
        }
    }
}
