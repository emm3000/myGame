package com.emm.mygame.navigation

import androidx.navigation3.runtime.EntryProviderScope
import androidx.navigation3.runtime.NavKey
import com.emm.mygame.AppDependencies
import com.emm.mygame.Destination
import com.emm.mygame.FrameKind
import com.emm.mygame.SignedInChrome
import com.emm.mygame.feature.report.ReportNavigation
import com.emm.mygame.feature.report.ReportRoute
import com.emm.mygame.feature.report.news.NewsRoute

internal fun EntryProviderScope<NavKey>.reportEntry(chrome: SignedInChrome) {
    val dependencies: AppDependencies = chrome.dependencies
    val navigator: Navigator = chrome.navigator
    entry<Destination.Report> {
        SignedInFrame(
            kind = FrameKind.Place,
            doesScreenReadTown = false,
            chrome = chrome,
        ) {
            ReportRoute(
                reports = dependencies.reports,
                towns = dependencies.towns,
                sessions = dependencies.sessions,
                reminders = dependencies.studyReminders,
                clock = dependencies.clock,
                navigation = ReportNavigation(
                    onNewsOpen = { navigator.openAbove(Destination.Report, Destination.News) },
                    onSettingsOpen = { navigator.openAbove(Destination.Report, Destination.Settings) },
                    onSigningOut = navigator::signingOut,
                    onSignedOut = { navigator.signedOut(isSessionEnded = false) },
                    onNewsClosed = chrome.onTaskAnswered,
                ),
            )
        }
    }
}

internal fun EntryProviderScope<NavKey>.newsEntry(chrome: SignedInChrome) {
    val dependencies: AppDependencies = chrome.dependencies
    entry<Destination.News> {
        SignedInFrame(
            kind = FrameKind.Place,
            doesScreenReadTown = false,
            chrome = chrome,
        ) {
            NewsRoute(reports = dependencies.reports, clock = dependencies.clock)
        }
    }
}
