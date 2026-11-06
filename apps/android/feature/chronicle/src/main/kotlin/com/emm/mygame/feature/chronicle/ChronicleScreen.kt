package com.emm.mygame.feature.chronicle

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameErrorBanner
import com.emm.mygame.core.designsystem.MyGameRadii
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameStrokeWidths
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.dashedFrame
import com.emm.mygame.core.network.ChronicleEvent
import java.time.ZoneId

@Composable
fun ChronicleScreen(state: ChronicleUiState, onIntent: (ChronicleIntent) -> Unit, modifier: Modifier = Modifier) {
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
        MyGameText(
            text = stringResource(R.string.chronicle_title),
            style = MyGameTypography.display,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { heading() },
        )
        when (state) {
            ChronicleUiState.Loading -> MyGameText(
                text = stringResource(R.string.chronicle_loading),
                style = MyGameTypography.body,
                color = MyGameTheme.colors.inkMuted,
            )
            ChronicleUiState.Failed -> MyGameErrorBanner(
                message = stringResource(R.string.chronicle_unreachable),
                actionLabel = stringResource(R.string.chronicle_retry),
                onAction = { onIntent(ChronicleIntent.RetryTapped) },
            )
            ChronicleUiState.Empty -> EmptyChronicle()
            is ChronicleUiState.Content -> ChronicleList(content = state)
        }
    }
}

@Composable
private fun EmptyChronicle(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .dashedFrame(MyGameTheme.colors.line)
            .padding(MyGameSpacing.step5),
    ) {
        MyGameText(
            text = stringResource(R.string.chronicle_empty),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.inkMuted,
        )
    }
}

@Composable
private fun ChronicleList(content: ChronicleUiState.Content, modifier: Modifier = Modifier) {
    val zone: ZoneId = ZoneId.systemDefault()
    Column(
        modifier = modifier
            .fillMaxWidth()
            .background(MyGameTheme.colors.surfaceRaised, RoundedCornerShape(MyGameRadii.md))
            .border(MyGameStrokeWidths.hairline, MyGameTheme.colors.line, RoundedCornerShape(MyGameRadii.md))
            .padding(horizontal = MyGameSpacing.step5),
    ) {
        content.events.forEachIndexed { index: Int, event: ChronicleEvent ->
            if (index > 0) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(MyGameStrokeWidths.hairline)
                        .background(MyGameTheme.colors.line),
                )
            }
            ChronicleLine(line = chronicleInstantOf(event.occurredAt, content.readAt, zone), event = event)
        }
    }
}
