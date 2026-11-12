package com.emm.mygame.feature.map

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
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
    TeamFormCard(
        form = form,
        title = icuStringResource(R.string.map_clean_up_title, "site" to form.site.toString()),
        send = send,
        isQuoteRefused = form.quote is MapUiState.CleanUpQuote.Refused,
        onIntent = onIntent,
        modifier = modifier,
    ) { isSendAnswered: Boolean ->
        form.quote
            ?.takeUnless { shown: MapUiState.CleanUpQuote ->
                isSendAnswered && shown !is MapUiState.CleanUpQuote.Quoted
            }
            ?.let { shown: MapUiState.CleanUpQuote -> CleanUpQuoteLines(quote = shown) }
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
