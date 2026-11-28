package com.emm.mygame.navigation

import androidx.navigation3.runtime.EntryProviderScope
import androidx.navigation3.runtime.NavKey
import com.emm.mygame.AppDependencies
import com.emm.mygame.Destination
import com.emm.mygame.feature.jobs.MapRoute
import com.emm.mygame.feature.shell.FrameKind

internal fun EntryProviderScope<NavKey>.jobsEntry(dependencies: AppDependencies, navigator: Navigator) {
    entry<Destination.Map> {
        SignedInFrame(
            kind = FrameKind.Door,
            dependencies = dependencies,
            navigator = navigator,
        ) {
            MapRoute(
                onNoTown = navigator::townUnnamed,
            )
        }
    }
}
