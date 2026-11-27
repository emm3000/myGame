package com.emm.mygame.navigation

import androidx.navigation3.runtime.EntryProviderScope
import androidx.navigation3.runtime.NavKey
import com.emm.mygame.AppDependencies
import com.emm.mygame.Destination
import com.emm.mygame.feature.report.news.NewsRoute
import com.emm.mygame.feature.shell.FrameKind

internal fun EntryProviderScope<NavKey>.newsEntry(dependencies: AppDependencies, navigator: Navigator) {
    entry<Destination.News> {
        SignedInFrame(
            kind = FrameKind.Door,
            dependencies = dependencies,
            navigator = navigator,
        ) {
            NewsRoute(reports = dependencies.reports, clock = dependencies.clock)
        }
    }
}
