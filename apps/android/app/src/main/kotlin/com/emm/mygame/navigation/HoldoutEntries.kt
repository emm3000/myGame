package com.emm.mygame.navigation

import androidx.navigation3.runtime.EntryProviderScope
import androidx.navigation3.runtime.NavKey
import com.emm.mygame.AppDependencies
import com.emm.mygame.Destination
import com.emm.mygame.feature.holdout.HoldoutCheckRoute
import com.emm.mygame.feature.shell.FrameKind

internal fun EntryProviderScope<NavKey>.holdoutCheckEntry(
    dependencies: AppDependencies,
    navigator: Navigator,
    onTaskAnswer: () -> Unit,
) {
    entry<Destination.HoldoutCheck> { check: Destination.HoldoutCheck ->
        SignedInFrame(
            kind = FrameKind.Task,
            dependencies = dependencies,
            navigator = navigator,
        ) {
            HoldoutCheckRoute(
                holdoutChecks = dependencies.holdoutChecks,
                band = check.band,
                week = check.week,
                onEnd = onTaskAnswer,
                onDone = navigator::back,
            )
        }
    }
}
