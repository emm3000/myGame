package com.emm.mygame.navigation

import androidx.navigation3.runtime.EntryProviderScope
import androidx.navigation3.runtime.NavKey
import com.emm.mygame.AppDependencies
import com.emm.mygame.Destination
import com.emm.mygame.FrameKind
import com.emm.mygame.SignedInChrome
import com.emm.mygame.feature.report.news.NewsRoute

internal fun EntryProviderScope<NavKey>.newsEntry(chrome: SignedInChrome) {
    val dependencies: AppDependencies = chrome.dependencies
    entry<Destination.News> {
        SignedInFrame(
            kind = FrameKind.Door,
            chrome = chrome,
        ) {
            NewsRoute(reports = dependencies.reports, clock = dependencies.clock)
        }
    }
}
