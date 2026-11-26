package com.emm.mygame.navigation

import androidx.navigation3.runtime.EntryProviderScope
import androidx.navigation3.runtime.NavKey
import com.emm.mygame.AppDependencies
import com.emm.mygame.Destination
import com.emm.mygame.FrameKind
import com.emm.mygame.SignedInChrome
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

internal fun EntryProviderScope<NavKey>.schoolEntry(chrome: SignedInChrome) {
    val dependencies: AppDependencies = chrome.dependencies
    val navigator: Navigator = chrome.navigator
    entry<Destination.School> {
        SignedInFrame(
            kind = FrameKind.Place,
            doesScreenReadTown = true,
            chrome = chrome,
        ) {
            SchoolRoute(
                towns = dependencies.towns,
                clock = dependencies.clock,
                onNoTown = navigator::townUnnamed,
                onLessonOpen = { lesson: LessonId -> navigator.openLesson(lesson, walked = emptyList()) },
                onLessonStart = chrome.onTaskAnswered,
                onTextOpen = { text: TextId -> navigator.openAbove(Destination.School, Destination.SchoolText(text)) },
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
            )
        }
    }
}

internal fun EntryProviderScope<NavKey>.lessonWordsEntry(chrome: SignedInChrome) {
    val dependencies: AppDependencies = chrome.dependencies
    val navigator: Navigator = chrome.navigator
    entry<Destination.LessonWords> { shown: Destination.LessonWords ->
        SignedInFrame(
            kind = FrameKind.Task,
            doesScreenReadTown = true,
            chrome = chrome,
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

internal fun EntryProviderScope<NavKey>.schoolTextEntry(chrome: SignedInChrome) {
    val dependencies: AppDependencies = chrome.dependencies
    val navigator: Navigator = chrome.navigator
    entry<Destination.SchoolText> { shown: Destination.SchoolText ->
        SignedInFrame(
            kind = FrameKind.Place,
            doesScreenReadTown = false,
            chrome = chrome,
        ) {
            SchoolTextRoute(
                text = shown.text,
                texts = dependencies.texts,
                onNoTown = navigator::townUnnamed,
                onSchoolOpen = { navigator.openTab(Tab.Learn) },
            )
        }
    }
}
