package com.emm.mygame.feature.town

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import com.emm.mygame.core.designsystem.MyGameErrorBanner
import com.emm.mygame.core.designsystem.MyGameHeader
import com.emm.mygame.core.designsystem.MyGameMetaText
import com.emm.mygame.core.designsystem.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.MyGameSizes
import com.emm.mygame.core.designsystem.MyGameSkeleton
import com.emm.mygame.core.designsystem.MyGameSkeletonBlocks
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameTextButton
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.PreviewMyGame
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.SeasonKind
import com.emm.mygame.core.network.TipKind
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownGoal
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.network.TownLabel
import com.emm.mygame.core.network.NextStepCard
import com.emm.mygame.core.ui.icuStringResource
import kotlin.time.Duration.Companion.days
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Instant

@Composable
fun TownScreen(
    state: TownUiState,
    onIntent: (TownIntent) -> Unit,
    onSchoolOpen: () -> Unit,
    onReportOpen: () -> Unit,
    onMapOpen: () -> Unit,
    onReviewsOpen: () -> Unit,
    onLessonOpen: (LessonId) -> Unit,
    modifier: Modifier = Modifier,
    ring: @Composable () -> Unit = {},
    status: @Composable () -> Unit = {},
) {
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step6),
        modifier = modifier
            .fillMaxSize()
            .background(MyGameTheme.colors.surface)
            .safeDrawingPadding()
            .verticalScroll(rememberScrollState())
            .padding(
                start = MyGameSpacing.step4,
                end = MyGameSpacing.step4,
                top = if (state is TownUiState.Content) MyGameSpacing.step2 else MyGameSpacing.step8,
                bottom = MyGameSpacing.step8,
            ),
    ) {
        MyGameSkeleton(
            isLoading = state == TownUiState.Loading,
            loadingLabel = stringResource(R.string.town_loading),
            blocks = townBlocks,
        ) {
            TownState(state = state, onIntent = onIntent) { content: TownUiState.Content ->
                TownHome(
                    content = content,
                    onIntent = onIntent,
                    onSchoolOpen = onSchoolOpen,
                    onReportOpen = onReportOpen,
                    onReviewsOpen = onReviewsOpen,
                    onLessonOpen = onLessonOpen,
                    header = {
                        MyGameHeader(end = ring) {
                            TownTitle(name = content.name, label = content.label)
                        }
                        status()
                    },
                )
                MapRow(onMapOpen = onMapOpen)
            }
        }
    }
}

@Composable
private fun TownState(
    state: TownUiState,
    onIntent: (TownIntent) -> Unit,
    home: @Composable (TownUiState.Content) -> Unit,
) {
    when (state) {
        TownUiState.Loading -> Unit
        TownUiState.Failed -> {
            MyGameErrorBanner(
                message = stringResource(R.string.town_refusal_unexpected),
                actionLabel = stringResource(R.string.town_try_again),
                onAction = { onIntent(TownIntent.RetryTapped) },
            )
            SignOut(isBusy = false, onIntent = onIntent)
        }
        TownUiState.SigningOut -> SignOut(isBusy = true, onIntent = onIntent)
        is TownUiState.Naming -> {
            NamingSection(naming = state, onIntent = onIntent)
            SignOut(isBusy = false, onIntent = onIntent)
        }
        is TownUiState.Content -> home(state)
    }
}

private val townBlocks: MyGameSkeletonBlocks = MyGameSkeletonBlocks(
    listOf(
        MyGameSizes.control,
        MyGameSizes.placeCard,
        MyGameSizes.secondary,
        MyGameSizes.placeCard,
        MyGameSizes.thumbnail,
    ),
)

@Composable
private fun SignOut(isBusy: Boolean, onIntent: (TownIntent) -> Unit, modifier: Modifier = Modifier) {
    MyGameTextButton(
        label = stringResource(R.string.town_sign_out),
        isBusy = isBusy,
        busyDescription = stringResource(R.string.town_waiting),
        onClick = { onIntent(TownIntent.SignOutTapped) },
        modifier = modifier,
    )
}

@Composable
private fun TownHome(
    content: TownUiState.Content,
    onIntent: (TownIntent) -> Unit,
    onSchoolOpen: () -> Unit,
    onReportOpen: () -> Unit,
    onReviewsOpen: () -> Unit,
    onLessonOpen: (LessonId) -> Unit,
    header: @Composable () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step6), modifier = modifier) {
        header()
        NextStepSection(
            content = content,
            onIntent = onIntent,
            onSchoolOpen = onSchoolOpen,
            onReportOpen = onReportOpen,
            onReviewsOpen = onReviewsOpen,
            onLessonOpen = onLessonOpen,
        )
        TownDoors(dueCount = content.dueCount(), onSchoolOpen = onSchoolOpen, onReportOpen = onReportOpen)
        TownSkyline(content = content)
        StocksSection(content = content)
        TipNote(tip = content.tip, place = TipPlace.Stocks, onIntent = onIntent)
        BuildingWorkSection(content = content, onIntent = onIntent)
        TipNote(tip = content.tip, place = TipPlace.Work, onIntent = onIntent)
        TipNote(tip = content.tip, place = TipPlace.Places, onIntent = onIntent)
        PlacesSection(content = content, onIntent = onIntent, onSchoolOpen = onSchoolOpen)
        TipNote(tip = content.tip, place = TipPlace.Office, onIntent = onIntent)
        OfficeSection(office = content.office, onIntent = onIntent)
    }
}

@Composable
private fun TownTitle(name: String, label: TownLabel, modifier: Modifier = Modifier) {
    MyGameMetaText(
        text = icuStringResource(R.string.town_title, "name" to name, "label" to stringResource(labelOf(label))),
        color = MyGameTheme.colors.inkMuted,
        modifier = modifier.semantics { heading() },
    )
}

private fun labelOf(label: TownLabel): Int = when (label) {
    TownLabel.Town -> R.string.town_label_town
    TownLabel.City -> R.string.town_label_city
}

private fun TownUiState.Content.dueCount(): Int = (nextStep.line as? NextStepCard.Line.ReviewsDue)?.count ?: 0

private val previewNextReviewAt: Instant = Instant.parse("2026-11-14T23:15:00Z")

private val previewHome: TownUiState.Content = TownUiState.Content(
    name = "Riverton",
    label = TownLabel.Town,
    stocks = TownResourceKind.entries.map { kind: TownResourceKind ->
        TownUiState.StockLine(kind = kind, amount = 350, capacity = 1000, ratePerHour = 20, skillLevel = 0)
    },
    people = TownUiState.PeopleLine(free = 19, atWork = 1),
    season = TownUiState.SeasonLine(kind = SeasonKind.Summer, year = 2, remaining = 3.days),
    slot = TownUiState.SlotLine.Idle,
    waitingList = emptyList(),
    places = listOf(
        TownUiState.PlaceCard(
            kind = TownBuildingKind.Factory,
            level = 0,
            raisedFrom = null,
            isInWork = false,
            next = TownUiState.NextLevelLine(
                level = 1,
                costs = listOf(
                    TownUiState.CostLine(TownResourceKind.Money, amount = 400, isShort = true),
                    TownUiState.CostLine(TownResourceKind.Material, amount = 120, isShort = false),
                ),
                duration = 2.minutes,
                people = 1,
            ),
            block = null,
        ),
    ),
    nextStep = NextStepCard(
        line = NextStepCard.Line.NoReviewsDue,
        detail = null,
        countdown = NextStepCard.Countdown.NextReview(at = previewNextReviewAt),
        action = NextStepCard.Action.GoToReport,
    ),
    nextStepTime = TownUiState.NextStepTime(remaining = 71.hours, finishesAt = previewNextReviewAt),
    goal = TownGoal(
        position = 2,
        count = 9,
        building = TownBuildingKind.Factory,
        level = 1,
        state = TownGoal.State.Pending(
            resources = listOf(TownSnapshot.Cost(TownResourceKind.Money, 50)),
            people = 0,
        ),
    ),
    tip = TipKind.Seasons,
    start = TownUiState.StartStatus.Idle,
    stop = TownUiState.StopStatus.Idle,
    office = TownUiState.OfficeLine(
        hiring = TownUiState.HiringLine.Idle,
        hires = emptyList(),
        place = TownUiState.HireStatus.Idle,
        stop = TownUiState.HireStopStatus.Idle,
    ),
)

private class TownScreenStates : PreviewParameterProvider<TownUiState> {

    override val values: Sequence<TownUiState> = sequenceOf(
        TownUiState.Loading,
        TownUiState.Failed,
        TownUiState.Naming(name = "Riverton", status = TownUiState.NamingStatus.Idle),
        previewHome,
    )
}

@PreviewMyGame
@Composable
private fun TownScreenPreview(@PreviewParameter(TownScreenStates::class) state: TownUiState) {
    MyGamePreviewSurface {
        TownScreen(
            state = state,
            onIntent = {},
            onSchoolOpen = {},
            onReportOpen = {},
            onMapOpen = {},
            onReviewsOpen = {},
            onLessonOpen = {},
        )
    }
}
