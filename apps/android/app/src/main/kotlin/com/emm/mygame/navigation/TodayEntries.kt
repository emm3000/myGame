package com.emm.mygame.navigation

import androidx.navigation3.runtime.EntryProviderScope
import androidx.navigation3.runtime.NavKey
import com.emm.mygame.AppDependencies
import com.emm.mygame.Destination
import com.emm.mygame.FrameKind
import com.emm.mygame.RetainedWordsRing
import com.emm.mygame.SignedInChrome
import com.emm.mygame.core.model.holdout.HoldoutCheckWeek
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.placement.PlacementBand
import com.emm.mygame.feature.today.TodayNavigation
import com.emm.mygame.feature.today.TodayRoute

internal fun EntryProviderScope<NavKey>.todayEntry(chrome: SignedInChrome) {
    val dependencies: AppDependencies = chrome.dependencies
    val navigator: Navigator = chrome.navigator
    entry<Destination.Today> {
        SignedInFrame(kind = FrameKind.Home, doesScreenReadTown = true, chrome = chrome, isDockWithheld = true) {
            TodayRoute(
                towns = dependencies.towns,
                clock = dependencies.clock,
                navigation = TodayNavigation(
                    onLessonOpen = { lesson: LessonId -> navigator.openLesson(lesson, walked = emptyList()) },
                    onReviewsOpen = navigator::openReviews,
                    onHoldoutCheckOpen = { band: PlacementBand, week: HoldoutCheckWeek ->
                        navigator.openHoldoutCheck(band, week)
                    },
                    onNoTown = navigator::townUnnamed,
                ),
                ring = { RetainedWordsRing(towns = dependencies.towns, doesScreenReadTown = true) },
            )
        }
    }
}
