package com.emm.mygame.feature.fief

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
import com.emm.mygame.core.designsystem.MyGameErrorBanner
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography

@Composable
fun FiefScreen(state: FiefUiState, onIntent: (FiefIntent) -> Unit, modifier: Modifier = Modifier) {
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
            FiefUiState.Loading -> Loading()
            FiefUiState.Failed -> Failed(onIntent = onIntent)
            is FiefUiState.Content -> Content(content = state, onIntent = onIntent)
        }
    }
}

@Composable
internal fun Header(title: String, modifier: Modifier = Modifier) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameText(
            text = stringResource(R.string.fief_brand),
            style = MyGameTypography.brand,
            color = MyGameTheme.colors.umber,
        )
        MyGameText(
            text = title,
            style = MyGameTypography.title,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { heading() },
        )
    }
}

@Composable
private fun Loading(modifier: Modifier = Modifier) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step6), modifier = modifier) {
        Header(title = stringResource(R.string.fief_eyebrow))
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
        Header(title = stringResource(R.string.fief_eyebrow))
        MyGameErrorBanner(
            message = stringResource(R.string.fief_unreachable),
            actionLabel = stringResource(R.string.fief_retry),
            onAction = { onIntent(FiefIntent.RetryTapped) },
        )
    }
}

@Composable
private fun Content(content: FiefUiState.Content, onIntent: (FiefIntent) -> Unit, modifier: Modifier = Modifier) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step6), modifier = modifier) {
        Header(title = content.name)
        ResourcesSection(content = content)
        SlotSection(content = content, onIntent = onIntent)
        if (content.queue.isNotEmpty()) QueueSection(content = content, onIntent = onIntent)
        BuildingsSection(content = content, onIntent = onIntent)
    }
}
