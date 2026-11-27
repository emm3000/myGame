package com.emm.mygame.navigation

import androidx.navigation3.runtime.EntryProviderScope
import androidx.navigation3.runtime.NavKey
import com.emm.mygame.AppDependencies
import com.emm.mygame.Destination
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.learning.TextId
import com.emm.mygame.feature.holdout.HoldoutCheckRow
import com.emm.mygame.feature.holdout.HoldoutCheckRowsRoute
import com.emm.mygame.feature.placement.PlacementOfferRoute
import com.emm.mygame.feature.school.words.LessonWalk
import com.emm.mygame.feature.school.words.LessonWordsNavigation
import com.emm.mygame.feature.school.words.LessonWordsRoute
import com.emm.mygame.feature.school.SchoolRoute
import com.emm.mygame.feature.school.text.SchoolTextRoute
import com.emm.mygame.feature.shell.FrameKind
import com.emm.mygame.feature.shell.bar.Tab
import com.emm.mygame.feature.shell.ring.RetainedWordsRing

internal fun EntryProviderScope<NavKey>.schoolEntry(
    dependencies: AppDependencies,
    navigator: Navigator,
    onTaskAnswer: () -> Unit,
) {
    entry<Destination.School> {
        SignedInFrame(kind = FrameKind.Home, dependencies = dependencies, navigator = navigator) {
            SchoolRoute(
                towns = dependencies.towns,
                clock = dependencies.clock,
                onNoTown = navigator::townUnnamed,
                onLessonOpen = { lesson: LessonId -> navigator.openLesson(lesson, walked = emptyList()) },
                onLessonStart = onTaskAnswer,
                onTextOpen = { text: TextId -> navigator.openAbove(Destination.School, Destination.SchoolText(text)) },
                onReviewsOpen = navigator::openReviews,
                holdoutChecks = {
                    HoldoutCheckRowsRoute(
                        holdoutChecks = dependencies.holdoutChecks,
                        onHoldoutCheckOpen = { row: HoldoutCheckRow -> navigator.openHoldoutCheck(row.band, row.week) },
                    )
                },
                placement = {
                    PlacementOfferRoute(
                        placements = dependencies.placements,
                        onPlacementOpen = { navigator.openOnTab(Destination.Placement) },
                    )
                },
                ring = { RetainedWordsRing(towns = dependencies.towns, doesScreenReadTown = true) },
            )
        }
    }
}

internal fun EntryProviderScope<NavKey>.lessonWordsEntry(dependencies: AppDependencies, navigator: Navigator) {
    entry<Destination.LessonWords> { shown: Destination.LessonWords ->
        SignedInFrame(
            kind = FrameKind.Task,
            dependencies = dependencies,
            navigator = navigator,
        ) {
            LessonWordsRoute(
                walk = LessonWalk(shown.lesson, shown.walked),
                towns = dependencies.towns,
                learning = dependencies.learning,
                clock = dependencies.clock,
                navigation = LessonWordsNavigation(
                    onNoTown = navigator::townUnnamed,
                    onLessonOpen = navigator::openLesson,
                    onReviewsOpen = navigator::openReviews,
                    onDone = navigator::back,
                ),
            )
        }
    }
}

internal fun EntryProviderScope<NavKey>.schoolTextEntry(dependencies: AppDependencies, navigator: Navigator) {
    entry<Destination.SchoolText> { shown: Destination.SchoolText ->
        SignedInFrame(kind = FrameKind.Door, dependencies = dependencies, navigator = navigator) {
            SchoolTextRoute(
                text = shown.text,
                texts = dependencies.texts,
                onNoTown = navigator::townUnnamed,
                onSchoolOpen = { navigator.openTab(Tab.Learn) },
            )
        }
    }
}
