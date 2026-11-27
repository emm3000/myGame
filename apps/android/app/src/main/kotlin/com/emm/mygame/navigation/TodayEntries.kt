package com.emm.mygame.navigation

import androidx.navigation3.runtime.EntryProviderScope
import androidx.navigation3.runtime.NavKey
import com.emm.mygame.AppDependencies
import com.emm.mygame.Destination
import com.emm.mygame.core.model.holdout.HoldoutCheckWeek
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.learning.TextId
import com.emm.mygame.core.model.placement.PlacementBand
import com.emm.mygame.feature.placement.PlacementOfferRoute
import com.emm.mygame.feature.shell.FrameKind
import com.emm.mygame.feature.shell.ring.RetainedWordsRing
import com.emm.mygame.feature.today.TodayNavigation
import com.emm.mygame.feature.today.TodayRoute

internal fun EntryProviderScope<NavKey>.todayEntry(dependencies: AppDependencies, navigator: Navigator) {
    entry<Destination.Today> {
        SignedInFrame(kind = FrameKind.Home, dependencies = dependencies, navigator = navigator) {
            TodayRoute(
                towns = dependencies.towns,
                reports = dependencies.reports,
                frames = dependencies.keepGoing,
                clock = dependencies.clock,
                navigation = TodayNavigation(
                    onLessonOpen = { lesson: LessonId -> navigator.openLesson(lesson, walked = emptyList()) },
                    onReviewsOpen = navigator::openReviews,
                    onHoldoutCheckOpen = { band: PlacementBand, week: HoldoutCheckWeek ->
                        navigator.openHoldoutCheck(band, week)
                    },
                    onMapOpen = { navigator.openOnTab(Destination.Map) },
                    onNewsOpen = { navigator.openAbove(Destination.Today, Destination.News) },
                    onTextOpen = { text: TextId ->
                        navigator.openAbove(Destination.Today, Destination.SchoolText(text))
                    },
                    onNoTown = navigator::townUnnamed,
                ),
                ring = { RetainedWordsRing(towns = dependencies.towns, doesScreenReadTown = true) },
                placement = {
                    PlacementOfferRoute(
                        placements = dependencies.placements,
                        onPlacementOpen = { navigator.openOnTab(Destination.Placement) },
                    )
                },
            )
        }
    }
}
