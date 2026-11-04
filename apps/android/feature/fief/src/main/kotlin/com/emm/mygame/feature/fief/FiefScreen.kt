package com.emm.mygame.feature.fief

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameButton
import com.emm.mygame.core.designsystem.MyGameErrorBanner
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography

@Composable
fun FiefScreen(
    state: FiefUiState,
    onIntent: (FiefIntent) -> Unit,
    onReviewOpen: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step6),
        modifier = modifier
            .fillMaxSize()
            .background(MyGameTheme.colors.surface)
            .safeDrawingPadding()
            .verticalScroll(rememberScrollState())
            .padding(start = MyGameSpacing.step4, end = MyGameSpacing.step4, top = MyGameSpacing.step8)
            .padding(bottom = MyGameSpacing.step8),
    ) {
        when (state) {
            FiefUiState.Loading -> Loading(onIntent = onIntent)
            FiefUiState.Failed -> Failed(onIntent = onIntent)
            FiefUiState.SigningOut -> SigningOut(onIntent = onIntent)
            is FiefUiState.Content -> Content(content = state, onIntent = onIntent, onReviewOpen = onReviewOpen)
        }
    }
}

@Composable
private fun Header(
    title: String,
    isSigningOut: Boolean,
    onIntent: (FiefIntent) -> Unit,
    modifier: Modifier = Modifier,
    season: FiefUiState.SeasonLine? = null,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
            MyGameText(
                text = stringResource(R.string.fief_brand),
                style = MyGameTypography.brand,
                color = MyGameTheme.colors.umber,
                modifier = Modifier.weight(1f),
            )
            MyGameButton(
                label = stringResource(R.string.sign_out),
                isBusy = isSigningOut,
                busyDescription = stringResource(R.string.building_waiting),
                onClick = { onIntent(FiefIntent.SignOutTapped) },
                modifier = Modifier.width(IntrinsicSize.Max),
            )
        }
        MyGameText(
            text = title,
            style = MyGameTypography.title,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { heading() },
        )
        season?.let { line: FiefUiState.SeasonLine -> SeasonLine(season = line) }
    }
}

@Composable
private fun Loading(onIntent: (FiefIntent) -> Unit, modifier: Modifier = Modifier) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step6), modifier = modifier) {
        Header(title = stringResource(R.string.fief_eyebrow), isSigningOut = false, onIntent = onIntent)
        MyGameText(
            text = stringResource(R.string.fief_loading),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.inkMuted,
        )
    }
}

@Composable
private fun Failed(onIntent: (FiefIntent) -> Unit, modifier: Modifier = Modifier) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step6), modifier = modifier) {
        Header(title = stringResource(R.string.fief_eyebrow), isSigningOut = false, onIntent = onIntent)
        MyGameErrorBanner(
            message = stringResource(R.string.fief_unreachable),
            actionLabel = stringResource(R.string.fief_retry),
            onAction = { onIntent(FiefIntent.RetryTapped) },
        )
    }
}

@Composable
private fun SigningOut(onIntent: (FiefIntent) -> Unit, modifier: Modifier = Modifier) {
    Header(
        title = stringResource(R.string.fief_eyebrow),
        isSigningOut = true,
        onIntent = onIntent,
        modifier = modifier,
    )
}

@Composable
private fun Content(
    content: FiefUiState.Content,
    onIntent: (FiefIntent) -> Unit,
    onReviewOpen: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step6), modifier = modifier) {
        Header(title = content.name, isSigningOut = false, onIntent = onIntent, season = content.season)
        ResourcesSection(content = content)
        SlotSection(content = content, onIntent = onIntent)
        if (content.queue.isNotEmpty()) QueueSection(content = content, onIntent = onIntent)
        BuildingsSection(content = content, onIntent = onIntent)
        content.library?.let { library: FiefUiState.LibraryLine ->
            LibrarySection(library = library, onIntent = onIntent, onReviewOpen = onReviewOpen)
        }
        content.army?.let { army: FiefUiState.ArmyLine ->
            ArmySection(army = army, onIntent = onIntent)
        }
    }
}
