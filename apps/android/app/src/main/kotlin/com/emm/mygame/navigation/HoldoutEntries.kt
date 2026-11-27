package com.emm.mygame.navigation

import androidx.navigation3.runtime.EntryProviderScope
import androidx.navigation3.runtime.NavKey
import com.emm.mygame.AppDependencies
import com.emm.mygame.Destination
import com.emm.mygame.FrameKind
import com.emm.mygame.SignedInChrome
import com.emm.mygame.feature.holdout.HoldoutCheckRoute

internal fun EntryProviderScope<NavKey>.holdoutCheckEntry(chrome: SignedInChrome) {
    val dependencies: AppDependencies = chrome.dependencies
    entry<Destination.HoldoutCheck> { check: Destination.HoldoutCheck ->
        SignedInFrame(
            kind = FrameKind.Task,
            chrome = chrome,
        ) {
            HoldoutCheckRoute(
                holdoutChecks = dependencies.holdoutChecks,
                band = check.band,
                week = check.week,
                onEnd = chrome.onTaskAnswered,
                onDone = chrome.navigator::back,
            )
        }
    }
}
