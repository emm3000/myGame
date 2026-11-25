package com.emm.mygame

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.WindowInsetsSides
import androidx.compose.foundation.layout.consumeWindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fitInside
import androidx.compose.foundation.layout.ime
import androidx.compose.foundation.layout.isImeVisible
import androidx.compose.foundation.layout.only
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.union
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.State
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.WindowInsetsRulers
import androidx.compose.ui.semantics.isTraversalGroup
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.traversalIndex
import com.emm.mygame.core.designsystem.MyGameBackLink
import com.emm.mygame.core.designsystem.MyGameDock
import com.emm.mygame.core.designsystem.MyGameDockGo
import com.emm.mygame.core.designsystem.MyGameHeader
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.model.holdout.HoldoutCheckWeek
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.placement.PlacementBand
import com.emm.mygame.core.ui.FRAME_DOCK_TURN
import com.emm.mygame.core.ui.FRAME_FOLDED_TOP_TURN
import com.emm.mygame.core.ui.NoticeInView
import com.emm.mygame.core.ui.TaskDock
import com.emm.mygame.core.ui.TaskDockHook
import com.emm.mygame.core.ui.TownFollow
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.frameHeaderTurn
import com.emm.mygame.feature.town.status.TownDock
import com.emm.mygame.feature.town.status.TownDockActions
import com.emm.mygame.feature.town.status.TownDockNotice
import com.emm.mygame.feature.town.status.TownNotice
import com.emm.mygame.feature.town.status.TownReportRow
import com.emm.mygame.feature.town.status.TownStatusIntent
import com.emm.mygame.feature.town.status.TownStatusUiState
import com.emm.mygame.feature.town.status.shownNotice
import com.emm.mygame.navigation.Tab
import com.emm.mygame.navigation.openFromDock

private const val TASK_DOCK_TURN: Float = 1f

@OptIn(ExperimentalLayoutApi::class)
@Composable
internal fun FramedScreen(
    kind: FrameKind,
    doesScreenReadTown: Boolean,
    chrome: SignedInChrome,
    modifier: Modifier = Modifier,
    isDockWithheld: Boolean = false,
    studyInPlace: @Composable (Int) -> MyGameDockGo? = { null },
    content: @Composable (ScreenFrame) -> Unit,
) {
    val framedInsets: WindowInsets =
        if (kind == FrameKind.Home) WindowInsets.ime else WindowInsets.ime.union(WindowInsets.statusBars)
    val isFolded: MutableState<Boolean> = remember { mutableStateOf(false) }
    val isKeyboardOpen: Boolean = WindowInsets.isImeVisible
    val isDockUnderKeyboard: Boolean = isKeyboardOpen && kind != FrameKind.Task
    val onStatusIntent: State<(TownStatusIntent) -> Unit> = rememberUpdatedState(chrome.onStatusIntent)
    val task: TaskDockHook = remember {
        TaskDockHook(onAnswered = { onStatusIntent.value(TownStatusIntent.ScreenAnswered) })
    }
    val follow: TownFollow? = task.town.takeIf { kind == FrameKind.Task }
    val dock: TownStatusUiState.Dock? =
        chrome.status.value.dock.takeIf { isTownDockShown(kind, isDockWithheld, follow) }
    val frame = ScreenFrame(
        task = task,
        foldedDock = { FoldedDockTop(dock = dock, isFolded = isFolded.value, turn = foldedTurnOf(kind)) },
        reportRow = {
            dock?.let { shown: TownStatusUiState.Dock ->
                TownReportRow(dock = shown, onClick = { chrome.navigator.openOnTab(Destination.Report) })
            }
        },
        status = chrome.banner,
    )
    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MyGameTheme.colors.surface)
            .semantics { isTraversalGroup = true },
    ) {
        if (kind != FrameKind.Home) {
            FrameHeader(doesScreenReadTown = doesScreenReadTown, chrome = chrome)
            frame.status()
        }
        Box(
            modifier = Modifier
                .weight(1f)
                .fitInside(WindowInsetsRulers.Ime.current)
                .consumeWindowInsets(framedInsets),
        ) {
            content(frame)
        }
        if (isDockUnderKeyboard) return@Column
        AboveKeyboard(isKeyboardOpen = isKeyboardOpen) {
            task.shownOn(kind)?.let { shown: TaskDock -> TaskFrameDock(shown = shown, onFoldChange = task::fold) }
            dock?.let { shown: TownStatusUiState.Dock ->
                FrameDock(
                    dock = shown,
                    chrome = chrome,
                    studyInPlace = studyInPlace,
                    onFoldChange = { folded: Boolean -> isFolded.value = folded },
                    follow = follow,
                )
            }
        }
    }
}

private fun foldedTurnOf(kind: FrameKind): Float = if (kind == FrameKind.Task) TASK_DOCK_TURN else FRAME_FOLDED_TOP_TURN

@Composable
private fun FoldedDockTop(dock: TownStatusUiState.Dock?, isFolded: Boolean, turn: Float) {
    if (dock == null || !isFolded) return
    val notice: TownNotice? = dock.shownNotice()
    NoticeInView(
        shownNotice = notice?.key,
        modifier = Modifier.semantics {
            isTraversalGroup = true
            traversalIndex = turn
        },
    ) {
        notice?.let { shown: TownNotice -> TownDockNotice(notice = shown) }
    }
}

private fun isTownDockShown(kind: FrameKind, isDockWithheld: Boolean, follow: TownFollow?): Boolean =
    !isDockWithheld && (kind != FrameKind.Task || follow != null)

private fun TaskDockHook.shownOn(kind: FrameKind): TaskDock? = dock.takeIf { kind == FrameKind.Task && town == null }

@Composable
private fun TaskFrameDock(shown: TaskDock, onFoldChange: (Boolean) -> Unit) {
    MyGameDock(
        go = shown.go,
        step = shown.step,
        onFoldChange = onFoldChange,
        modifier = Modifier
            .windowInsetsPadding(WindowInsets.safeDrawing.only(WindowInsetsSides.Horizontal))
            .semantics { traversalIndex = TASK_DOCK_TURN },
        notice = shown.notice,
    )
}

@Composable
private fun FrameHeader(doesScreenReadTown: Boolean, chrome: SignedInChrome) {
    MyGameHeader(
        modifier = Modifier
            .statusBarsPadding()
            .padding(horizontal = MyGameSpacing.step4)
            .frameHeaderTurn(),
        end = { RetainedWordsRing(towns = chrome.dependencies.towns, doesScreenReadTown = doesScreenReadTown) },
    ) {
        if (chrome.navigator.isOnTabRoot) return@MyGameHeader
        MyGameBackLink(
            label = chromeResource(chrome.navigator.tabUnder.label),
            isEnabled = chrome.navigator.areLinksEnabled,
            onClick = { chrome.navigator.openTab(chrome.navigator.tabUnder) },
        )
    }
}

@Composable
private fun FrameDock(
    dock: TownStatusUiState.Dock,
    chrome: SignedInChrome,
    studyInPlace: @Composable (Int) -> MyGameDockGo?,
    onFoldChange: (Boolean) -> Unit,
    follow: TownFollow?,
) {
    TownDock(
        dock = dock,
        actions = chrome.dockActions(),
        onFoldChange = onFoldChange,
        modifier = Modifier
            .windowInsetsPadding(WindowInsets.safeDrawing.only(WindowInsetsSides.Horizontal))
            .semantics { traversalIndex = if (follow == null) FRAME_DOCK_TURN else TASK_DOCK_TURN },
        inPlace = dock.studiedInPlace()?.let { number: Int -> studyInPlace(number) },
    )
}

private fun TownStatusUiState.Dock.studiedInPlace(): Int? =
    ((this as? TownStatusUiState.Dock.Step)?.go as? TownStatusUiState.Go.ActsInPlace)?.action?.number

private fun SignedInChrome.dockActions(): TownDockActions = TownDockActions(
    onIntent = onStatusIntent,
    onLessonOpen = { lesson: LessonId -> navigator.openFromDock { openLesson(lesson, walked = emptyList()) } },
    onSchoolOpen = { navigator.openFromDock { openTab(Tab.Learn) } },
    onReviewsOpen = { navigator.openFromDock { openReviews() } },
    onReportOpen = { navigator.openFromDock { openOnTab(Destination.Report) } },
    onHoldoutCheckOpen = { band: PlacementBand, week: HoldoutCheckWeek ->
        navigator.openFromDock { openHoldoutCheck(band, week) }
    },
)
