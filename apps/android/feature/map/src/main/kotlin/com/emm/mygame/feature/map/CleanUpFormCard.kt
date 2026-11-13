package com.emm.mygame.feature.map

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.rememberPlayerCopy

@Composable
internal fun CleanUpFormCard(
    form: MapUiState.CleanUpForm,
    send: MapUiState.SendRequest,
    onIntent: (MapIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    TeamFormCard(
        form = form,
        title = chromeResource(R.string.map_clean_up_title, "site" to form.site.toString()),
        send = send,
        quoteRefusal = (form.quote as? MapUiState.CleanUpQuote.Refused)?.refusal,
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
    val copy: PlayerCopy = rememberPlayerCopy()
    when (quote) {
        MapUiState.CleanUpQuote.Asking -> Unit
        is MapUiState.CleanUpQuote.Quoted -> QuotedCleanUp(quote = quote, modifier = modifier)
        is MapUiState.CleanUpQuote.Refused ->
            MyGameInlineAlert(message = copy.fixedCopy { jobRefusalLineOf(quote.refusal) }, modifier = modifier)
        MapUiState.CleanUpQuote.Unreachable ->
            MyGameInlineAlert(message = copy.fixedCopy(R.string.map_refusal_unexpected), modifier = modifier)
    }
}

@Composable
private fun QuotedCleanUp(quote: MapUiState.CleanUpQuote.Quoted, modifier: Modifier = Modifier) {
    val copy: PlayerCopy = rememberPlayerCopy()
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
        modifier = modifier.semantics(mergeDescendants = true) { liveRegion = LiveRegionMode.Polite },
    ) {
        MyGameText(
            label = copy.chrome(R.string.map_clean_up_strength, "strength" to quote.strength.toString()),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.ink,
        )
        MyGameText(
            label = copy.chrome(R.string.map_waste, "waste" to quote.waste.toString()),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.ink,
        )
        if (quote.pay.isNotEmpty()) {
            MyGameText(
                label = copy.chrome { text(R.string.map_clean_up_pay, "amounts" to amountsOf(quote.pay)) },
                style = MyGameTypography.body,
                color = MyGameTheme.colors.ink,
            )
        }
        if (quote.isShort) {
            MyGameText(
                label = copy.chrome(R.string.map_clean_up_short),
                style = MyGameTypography.body,
                color = MyGameTheme.colors.warningInk,
            )
        }
    }
}
