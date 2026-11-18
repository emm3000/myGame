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
import com.emm.mygame.core.designsystem.MyGameDockDoor
import com.emm.mygame.core.designsystem.MyGameDockGo
import com.emm.mygame.core.designsystem.MyGameHeader
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.HoldoutCheckWeek
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.PlacementBand
import com.emm.mygame.core.ui.FRAME_DOCK_TURN
import com.emm.mygame.core.ui.FRAME_FOLDED_TOP_TURN
import com.emm.mygame.core.ui.TaskDock
import com.emm.mygame.core.ui.TaskDockHook
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.frameHeaderTurn
import com.emm.mygame.feature.town.TownDock
import com.emm.mygame.feature.town.TownDockActions
import com.emm.mygame.feature.town.TownDockTop
import com.emm.mygame.feature.town.TownStatusIntent
import com.emm.mygame.feature.town.TownStatusUiState
import com.emm.mygame.feature.town.reportDoor

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
    val door: MyGameDockDoor? = doorOf(kind, chrome.navigator)
    val dock: TownStatusUiState.Dock? =
        chrome.status.value.dock.takeUnless { isDockWithheld || kind == FrameKind.Task }
    val onStatusIntent: State<(TownStatusIntent) -> Unit> = rememberUpdatedState(chrome.onStatusIntent)
    val task: TaskDockHook = remember {
        TaskDockHook(onAnswered = { onStatusIntent.value(TownStatusIntent.ScreenAnswered) })
    }
    val frame = ScreenFrame(
        task = task,
        foldedDock = {
            if (dock != null && isFolded.value) {
                Box(
                    modifier = Modifier.semantics {
                        isTraversalGroup = true
                        traversalIndex = FRAME_FOLDED_TOP_TURN
                    },
                ) {
                    TownDockTop(dock = dock, door = door)
                }
            }
        },
    )
    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MyGameTheme.colors.surface)
            .semantics { isTraversalGroup = true },
    ) {
        if (kind != FrameKind.Home) {
            FrameHeader(kind = kind, doesScreenReadTown = doesScreenReadTown, chrome = chrome)
            chrome.banner()
        }
        Box(
            modifier = Modifier
                .weight(1f)
                .fitInside(WindowInsetsRulers.Ime.current)
                .consumeWindowInsets(framedInsets),
        ) {
            content(frame)
        }
        if (isKeyboardOpen) return@Column
        task.dock?.takeIf { kind == FrameKind.Task }?.let { shown: TaskDock -> TaskFrameDock(shown) }
        dock?.let { shown: TownStatusUiState.Dock ->
            FrameDock(
                dock = shown,
                chrome = chrome,
                door = door,
                studyInPlace = studyInPlace,
                onFoldChange = { folded: Boolean -> isFolded.value = folded },
            )
        }
    }
}

@Composable
private fun TaskFrameDock(shown: TaskDock) {
    MyGameDock(
        line = shown.line,
        go = shown.go,
        onFoldChange = {},
        modifier = Modifier
            .windowInsetsPadding(WindowInsets.safeDrawing.only(WindowInsetsSides.Horizontal))
            .semantics { traversalIndex = TASK_DOCK_TURN },
        notice = shown.notice,
    )
}

@Composable
private fun FrameHeader(kind: FrameKind, doesScreenReadTown: Boolean, chrome: SignedInChrome) {
    MyGameHeader(
        modifier = Modifier
            .statusBarsPadding()
            .padding(horizontal = MyGameSpacing.step4)
            .frameHeaderTurn(),
        end = { RetainedWordsRing(towns = chrome.dependencies.towns, doesScreenReadTown = doesScreenReadTown) },
    ) {
        if (kind == FrameKind.Task) {
            MyGameBackLink(
                label = chromeResource(R.string.navigation_town),
                isEnabled = chrome.navigator.areLinksEnabled,
                onClick = chrome.navigator::openTown,
            )
        }
    }
}

@Composable
private fun FrameDock(
    dock: TownStatusUiState.Dock,
    chrome: SignedInChrome,
    door: MyGameDockDoor?,
    studyInPlace: @Composable (Int) -> MyGameDockGo?,
    onFoldChange: (Boolean) -> Unit,
) {
    TownDock(
        dock = dock,
        actions = chrome.dockActions(),
        onFoldChange = onFoldChange,
        modifier = Modifier
            .windowInsetsPadding(WindowInsets.safeDrawing.only(WindowInsetsSides.Horizontal))
            .semantics { traversalIndex = FRAME_DOCK_TURN },
        door = door,
        inPlace = dock.studiedInPlace()?.let { number: Int -> studyInPlace(number) },
    )
}

@Composable
private fun doorOf(kind: FrameKind, navigator: Navigator): MyGameDockDoor? = when (kind) {
    FrameKind.Home -> reportDoor(onClick = navigator::openReport)
    FrameKind.Place -> MyGameDockDoor(
        label = chromeResource(R.string.navigation_town),
        onClick = { navigator.openFromDock { openTown() } },
    )
    FrameKind.Task -> null
}

private fun TownStatusUiState.Dock.studiedInPlace(): Int? =
    ((this as? TownStatusUiState.Dock.Step)?.go as? TownStatusUiState.Go.ActsInPlace)?.action?.number

private fun SignedInChrome.dockActions(): TownDockActions = TownDockActions(
    onIntent = onStatusIntent,
    onLessonOpen = { lesson: LessonId -> navigator.openFromDock { openLesson(lesson, walked = emptyList()) } },
    onSchoolOpen = { navigator.openFromDock { openSchool() } },
    onReviewsOpen = { navigator.openFromDock { openReviews() } },
    onReportOpen = { navigator.openFromDock { openReport() } },
    onHoldoutCheckOpen = { band: PlacementBand, week: HoldoutCheckWeek ->
        navigator.openFromDock { openHoldoutCheck(band, week) }
    },
)
