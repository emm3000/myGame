package com.emm.mygame.navigation

import androidx.navigation3.runtime.EntryProviderScope
import androidx.navigation3.runtime.NavKey
import com.emm.mygame.AppDependencies
import com.emm.mygame.Destination
import com.emm.mygame.feature.learning.reviews.ReviewRoute
import com.emm.mygame.feature.shell.FrameKind

internal fun EntryProviderScope<NavKey>.reviewEntry(
    dependencies: AppDependencies,
    navigator: Navigator,
    onTaskAnswer: () -> Unit,
) {
    entry<Destination.Review> {
        SignedInFrame(
            kind = FrameKind.Task,
            dependencies = dependencies,
            navigator = navigator,
        ) {
            ReviewRoute(
                learning = dependencies.learning,
                towns = dependencies.towns,
                clock = dependencies.clock,
                onAnswer = onTaskAnswer,
                onDone = navigator::back,
            )
        }
    }
}
