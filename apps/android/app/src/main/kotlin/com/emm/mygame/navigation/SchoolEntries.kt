package com.emm.mygame.navigation

import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.State
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation3.runtime.EntryProviderScope
import androidx.navigation3.runtime.NavKey
import com.emm.mygame.AppDependencies
import com.emm.mygame.Destination
import com.emm.mygame.FrameKind
import com.emm.mygame.ScreenFrame
import com.emm.mygame.SignedInChrome
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.learning.TextId
import com.emm.mygame.core.model.town.HeldTown
import com.emm.mygame.feature.holdout.HoldoutCheckRow
import com.emm.mygame.feature.holdout.HoldoutCheckRowsRoute
import com.emm.mygame.feature.school.LessonWalk
import com.emm.mygame.feature.school.LessonWordsNavigation
import com.emm.mygame.feature.school.LessonWordsRoute
import com.emm.mygame.feature.school.SchoolRoute
import com.emm.mygame.feature.school.SchoolTextRoute
import com.emm.mygame.feature.school.SchoolUiState
import com.emm.mygame.feature.school.SchoolViewModel
import com.emm.mygame.feature.school.schoolStudyGo
import com.emm.mygame.feature.town.TownStatusIntent

internal fun EntryProviderScope<NavKey>.schoolEntry(chrome: SignedInChrome) {
    val dependencies: AppDependencies = chrome.dependencies
    val navigator: Navigator = chrome.navigator
    entry<Destination.School> {
        val school: SchoolViewModel = viewModel { SchoolViewModel(dependencies.towns, dependencies.clock) }
        val schoolState: State<SchoolUiState> = school.state.collectAsStateWithLifecycle()
        val heldTown: State<HeldTown?> = dependencies.towns.town.collectAsStateWithLifecycle()
        val drawnLesson: LessonId? = schoolState.value.drawnLesson()
        LaunchedEffect(drawnLesson) { chrome.onStatusIntent(TownStatusIntent.SchoolLessonDrawn(drawnLesson)) }
        SignedInFrame(
            kind = FrameKind.Place,
            doesScreenReadTown = true,
            chrome = chrome,
            studyInPlace = { number: Int ->
                schoolStudyGo(schoolState.value, heldTown.value?.town, number, school::onIntent)
            },
        ) { frame: ScreenFrame ->
            SchoolRoute(
                towns = dependencies.towns,
                clock = dependencies.clock,
                onNoTown = navigator::openTown,
                onLessonOpen = { lesson: LessonId -> navigator.openLesson(lesson, walked = emptyList()) },
                onLessonStart = frame.onAnswered,
                onTextOpen = { text: TextId -> navigator.openAbove(Destination.School, Destination.SchoolText(text)) },
                viewModel = school,
                foldedDock = frame.foldedDock,
                holdoutChecks = {
                    HoldoutCheckRowsRoute(
                        holdoutChecks = dependencies.holdoutChecks,
                        onHoldoutCheckOpen = { row: HoldoutCheckRow -> navigator.openHoldoutCheck(row.band, row.week) },
                    )
                },
            )
        }
    }
}

private fun SchoolUiState.drawnLesson(): LessonId? =
    ((this as? SchoolUiState.Content)?.slot as? SchoolUiState.SlotLine.Running)?.lesson

internal fun EntryProviderScope<NavKey>.lessonWordsEntry(chrome: SignedInChrome) {
    val dependencies: AppDependencies = chrome.dependencies
    val navigator: Navigator = chrome.navigator
    entry<Destination.LessonWords> { shown: Destination.LessonWords ->
        SignedInFrame(
            kind = FrameKind.Task,
            doesScreenReadTown = true,
            chrome = chrome,
        ) { frame: ScreenFrame ->
            LessonWordsRoute(
                walk = LessonWalk(shown.lesson, shown.walked),
                towns = dependencies.towns,
                learning = dependencies.learning,
                clock = dependencies.clock,
                navigation = LessonWordsNavigation(
                    onNoTown = navigator::openTown,
                    onLessonOpen = navigator::openLesson,
                    onReviewsOpen = navigator::openReviews,
                    onSchoolOpen = navigator::openSchool,
                ),
                task = frame.task,
                foldedDock = frame.foldedDock,
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
            doesScreenReadTown = true,
            chrome = chrome,
        ) { frame: ScreenFrame ->
            SchoolTextRoute(
                text = shown.text,
                texts = dependencies.texts,
                onNoTown = navigator::openTown,
                onSchoolOpen = navigator::openSchool,
                foldedDock = frame.foldedDock,
            )
        }
    }
}
