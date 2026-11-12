package com.emm.mygame.feature.map

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.hideFromAccessibility
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameButton
import com.emm.mygame.core.designsystem.MyGameCard
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.ui.icuStringResource

@Composable
internal fun CleanUpFormCard(
    form: MapUiState.CleanUpForm,
    send: MapUiState.SendRequest,
    onIntent: (MapIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val reason: String? = form.block?.let { block: MapUiState.JobBlock -> jobBlockLineOf(block) }
    val isSendAnswered: Boolean = send.isAnsweredFor(form.site)
    val isApiAnswered: Boolean = isSendAnswered || form.quote is MapUiState.CleanUpQuote.Refused
    val quote: MapUiState.CleanUpQuote? = form.quote?.takeUnless { shown: MapUiState.CleanUpQuote ->
        isSendAnswered && shown !is MapUiState.CleanUpQuote.Quoted
    }
    MyGameCard(modifier = modifier) {
        Column(
            verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
            modifier = Modifier.padding(vertical = MyGameSpacing.step4),
        ) {
            MyGameText(
                text = icuStringResource(R.string.map_clean_up_title, "site" to form.site.toString()),
                style = MyGameTypography.heading,
                color = MyGameTheme.colors.ink,
                modifier = Modifier.semantics { heading() },
            )
            JobField(
                value = form.workers,
                label = stringResource(R.string.map_job_workers),
                field = MapIntent.JobField.Workers,
                onIntent = onIntent,
                supportingText = icuStringResource(R.string.map_job_at_home, "count" to form.workersAtHome.toString()),
            )
            JobField(
                value = form.trucks,
                label = stringResource(R.string.map_job_trucks),
                field = MapIntent.JobField.Trucks,
                onIntent = onIntent,
                supportingText = icuStringResource(R.string.map_job_at_home, "count" to form.trucksAtHome.toString()),
            )
            quote?.let { shown: MapUiState.CleanUpQuote -> CleanUpQuoteLines(quote = shown) }
            MyGameButton(
                label = stringResource(R.string.map_job_send),
                isBusy = send == MapUiState.SendRequest.Waiting,
                busyDescription = stringResource(R.string.map_waiting),
                onClick = { onIntent(MapIntent.SendTapped) },
                blockedReason = reason,
            )
            reason?.takeUnless { isApiAnswered }?.let { line: String ->
                MyGameText(
                    text = line,
                    style = MyGameTypography.caption,
                    color = MyGameTheme.colors.warningInk,
                    modifier = Modifier.semantics { hideFromAccessibility() },
                )
            }
            SendAnswer(site = form.site, send = send)
        }
    }
}

@Composable
private fun CleanUpQuoteLines(quote: MapUiState.CleanUpQuote, modifier: Modifier = Modifier) {
    when (quote) {
        MapUiState.CleanUpQuote.Asking -> Unit
        is MapUiState.CleanUpQuote.Quoted -> QuotedCleanUp(quote = quote, modifier = modifier)
        is MapUiState.CleanUpQuote.Refused ->
            MyGameInlineAlert(message = jobRefusalLineOf(quote.refusal), modifier = modifier)
        MapUiState.CleanUpQuote.Unreachable ->
            MyGameInlineAlert(message = stringResource(R.string.map_refusal_unexpected), modifier = modifier)
    }
}

@Composable
private fun QuotedCleanUp(quote: MapUiState.CleanUpQuote.Quoted, modifier: Modifier = Modifier) {
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
        modifier = modifier.semantics(mergeDescendants = true) { liveRegion = LiveRegionMode.Polite },
    ) {
        MyGameText(
            text = icuStringResource(R.string.map_clean_up_strength, "strength" to quote.strength.toString()),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.ink,
        )
        MyGameText(
            text = icuStringResource(R.string.map_waste, "waste" to quote.waste.toString()),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.ink,
        )
        if (quote.pay.isNotEmpty()) {
            MyGameText(
                text = quotedCleanUpPayLineOf(quote),
                style = MyGameTypography.body,
                color = MyGameTheme.colors.ink,
            )
        }
        if (quote.isShort) {
            MyGameText(
                text = stringResource(R.string.map_clean_up_short),
                style = MyGameTypography.body,
                color = MyGameTheme.colors.warningInk,
            )
        }
    }
}
