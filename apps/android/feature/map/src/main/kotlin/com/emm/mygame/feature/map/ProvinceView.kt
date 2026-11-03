package com.emm.mygame.feature.map

import android.content.res.Resources
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalResources
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import com.emm.mygame.core.designsystem.MyGameButton
import com.emm.mygame.core.designsystem.MyGameRadii
import com.emm.mygame.core.designsystem.MyGameSizes
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTextField
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.network.MapPlot
import com.emm.mygame.core.network.PlotHolder

@Composable
internal fun ProvinceView(content: MapUiState.Content, onIntent: (MapIntent) -> Unit, modifier: Modifier = Modifier) {
    val resources: Resources = LocalResources.current
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step4), modifier = modifier) {
        BrowseControls(content = content, onIntent = onIntent)
        Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1)) {
            MyGameText(
                text = resources.headingOf(content.map),
                style = MyGameTypography.title,
                color = MyGameTheme.colors.ink,
                modifier = Modifier.semantics { heading() },
            )
            MyGameText(
                text = resources.terrainLineOf(content.map.terrain),
                style = MyGameTypography.body,
                color = MyGameTheme.colors.inkMuted,
            )
        }
        Column(
            verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
            modifier = Modifier
                .fillMaxWidth()
                .background(MyGameTheme.colors.surfaceSunken, RoundedCornerShape(MyGameRadii.md))
                .padding(MyGameSpacing.step3),
        ) {
            content.map.plots.forEach { plot: MapPlot ->
                PlotLine(plot = plot, content = content, onIntent = onIntent)
            }
        }
    }
}

@Composable
private fun BrowseControls(content: MapUiState.Content, onIntent: (MapIntent) -> Unit, modifier: Modifier = Modifier) {
    val busyDescription: String = stringResource(R.string.map_jump_reading)
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        Row(horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2)) {
            if (content.hasPrevious) {
                MyGameButton(
                    label = stringResource(R.string.map_previous),
                    isBusy = false,
                    busyDescription = busyDescription,
                    onClick = { onIntent(MapIntent.PreviousTapped) },
                    modifier = Modifier.weight(1f),
                )
            }
            if (content.hasNext) {
                MyGameButton(
                    label = stringResource(R.string.map_next),
                    isBusy = false,
                    busyDescription = busyDescription,
                    onClick = { onIntent(MapIntent.NextTapped) },
                    modifier = Modifier.weight(1f),
                )
            }
        }
        MyGameTextField(
            value = content.jumpEntry,
            label = stringResource(R.string.map_jump),
            isSecret = false,
            isReadOnly = false,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number, imeAction = ImeAction.Go),
            onValueChange = { entry: String -> onIntent(MapIntent.JumpEntryChanged(entry)) },
            keyboardActions = KeyboardActions(onGo = { onIntent(MapIntent.JumpTapped) }),
        )
        MyGameButton(
            label = stringResource(R.string.map_jump),
            isBusy = false,
            busyDescription = busyDescription,
            onClick = { onIntent(MapIntent.JumpTapped) },
        )
    }
}

@Composable
private fun PlotLine(
    plot: MapPlot,
    content: MapUiState.Content,
    onIntent: (MapIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        PlotHolderLines(plot = plot)
        content.offersOn(plot.plot).forEach { order: MapUiState.OfferedOrder ->
            OrderAction(plot = plot.plot, order = order, terrain = content.map.terrain, onIntent = onIntent)
        }
        content.form?.takeIf { form: MapUiState.MarchForm -> form.target.plot == plot.plot }?.let { form ->
            MarchFormView(form = form, onIntent = onIntent)
        }
        content.sent?.takeIf { sent: MapUiState.SentMarch -> sent.target.plot == plot.plot }?.let { sent ->
            SentMarchView(sent = sent)
        }
    }
}

@Composable
private fun PlotHolderLines(plot: MapPlot, modifier: Modifier = Modifier) {
    val isOwn: Boolean = plot.holder is PlotHolder.Own
    val edge: Color = if (isOwn) MyGameTheme.colors.river else MyGameTheme.colors.line
    val shape: RoundedCornerShape = RoundedCornerShape(MyGameRadii.sm)
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
        modifier = modifier
            .fillMaxWidth()
            .background(MyGameTheme.colors.surfaceRaised, shape)
            .border(MyGameSizes.hairline, edge, shape)
            .padding(horizontal = MyGameSpacing.step4, vertical = MyGameSpacing.step3)
            .semantics(mergeDescendants = true) { },
    ) {
        LocalResources.current.plotLinesOf(plot).forEach { line: String ->
            MyGameText(text = line, style = MyGameTypography.body, color = MyGameTheme.colors.ink)
        }
    }
}
