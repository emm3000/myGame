package com.emm.mygame.navigation

import androidx.navigation3.runtime.EntryProviderScope
import androidx.navigation3.runtime.NavKey
import com.emm.mygame.AppDependencies
import com.emm.mygame.Destination
import com.emm.mygame.feature.placement.PlacementRoute
import com.emm.mygame.feature.shell.FrameKind

internal fun EntryProviderScope<NavKey>.placementEntry(
    dependencies: AppDependencies,
    navigator: Navigator,
    onTaskAnswer: () -> Unit,
) {
    entry<Destination.Placement> {
        SignedInFrame(
            kind = FrameKind.Task,
            dependencies = dependencies,
            navigator = navigator,
        ) {
            PlacementRoute(
                placements = dependencies.placements,
                onEnd = onTaskAnswer,
                onDone = navigator::back,
            )
        }
    }
}
