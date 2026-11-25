package com.emm.mygame.navigation

import androidx.navigation3.runtime.EntryProviderScope
import androidx.navigation3.runtime.NavKey
import com.emm.mygame.AppDependencies
import com.emm.mygame.Destination
import com.emm.mygame.FrameKind
import com.emm.mygame.ScreenFrame
import com.emm.mygame.SignedInChrome
import com.emm.mygame.feature.learning.reviews.ReviewRoute

internal fun EntryProviderScope<NavKey>.reviewEntry(chrome: SignedInChrome) {
    val dependencies: AppDependencies = chrome.dependencies
    entry<Destination.Review> {
        SignedInFrame(
            kind = FrameKind.Task,
            doesScreenReadTown = true,
            chrome = chrome,
        ) { frame: ScreenFrame ->
            ReviewRoute(
                learning = dependencies.learning,
                towns = dependencies.towns,
                clock = dependencies.clock,
                onAnswer = frame.onAnswered,
                onDone = chrome.navigator::back,
            )
        }
    }
}
