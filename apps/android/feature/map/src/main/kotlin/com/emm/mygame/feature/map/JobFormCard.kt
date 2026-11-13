package com.emm.mygame.feature.map

import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTextField
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.rememberPlayerCopy

@Composable
internal fun JobFormCard(
    form: MapUiState.JobForm,
    send: MapUiState.SendRequest,
    onIntent: (MapIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    TeamFormCard(
        form = form,
        title = chromeResource(R.string.map_job_title, "site" to form.site.toString()),
        send = send,
        quoteRefusal = (form.quote as? MapUiState.PayQuote.Refused)?.refusal,
        onIntent = onIntent,
        modifier = modifier,
        extraFields = {
            JobField(
                value = form.hours,
                label = chromeResource(R.string.map_job_hours),
                field = MapIntent.JobField.Hours,
                onIntent = onIntent,
            )
        },
    ) { isSendAnswered: Boolean ->
        form.quote
            ?.takeUnless { shown: MapUiState.PayQuote -> isSendAnswered && shown !is MapUiState.PayQuote.Quoted }
            ?.let { shown: MapUiState.PayQuote -> QuoteLine(quote = shown) }
    }
}

@Composable
internal fun JobField(
    value: String,
    label: MyGameLabel,
    field: MapIntent.JobField,
    onIntent: (MapIntent) -> Unit,
    modifier: Modifier = Modifier,
    supportingText: String? = null,
) {
    MyGameTextField(
        value = value,
        label = label,
        isSecret = false,
        isReadOnly = false,
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number, imeAction = ImeAction.Next),
        onValueChange = { entry: String -> onIntent(MapIntent.JobEntryChanged(field, entry)) },
        modifier = modifier,
        supportingText = supportingText,
    )
}

internal fun MapUiState.SendRequest.isAnsweredFor(site: Int): Boolean = when (this) {
    is MapUiState.SendRequest.Refused -> this.site == site
    is MapUiState.SendRequest.Unreachable -> this.site == site
    MapUiState.SendRequest.Idle, MapUiState.SendRequest.Waiting -> false
}

@Composable
private fun QuoteLine(quote: MapUiState.PayQuote, modifier: Modifier = Modifier) {
    val copy: PlayerCopy = rememberPlayerCopy()
    when (quote) {
        MapUiState.PayQuote.Asking -> Unit
        is MapUiState.PayQuote.Quoted -> if (quote.pay.isNotEmpty()) {
            MyGameText(
                label = copy.chrome { text(R.string.map_job_pay, "amounts" to amountsOf(quote.pay)) },
                style = MyGameTypography.body,
                color = MyGameTheme.colors.ink,
                modifier = modifier.semantics { liveRegion = LiveRegionMode.Polite },
            )
        }
        is MapUiState.PayQuote.Refused ->
            MyGameInlineAlert(message = copy.fixedCopy { jobRefusalLineOf(quote.refusal) }, modifier = modifier)
        MapUiState.PayQuote.Unreachable ->
            MyGameInlineAlert(message = copy.fixedCopy(R.string.map_refusal_unexpected), modifier = modifier)
    }
}

@Composable
internal fun SendAnswer(site: Int, send: MapUiState.SendRequest, modifier: Modifier = Modifier) {
    val copy: PlayerCopy = rememberPlayerCopy()
    val message: String? = when (send) {
        is MapUiState.SendRequest.Refused ->
            if (send.site == site) copy.fixedCopy { jobRefusalLineOf(send.refusal) } else null
        is MapUiState.SendRequest.Unreachable ->
            if (send.site == site) copy.fixedCopy(R.string.map_refusal_unexpected) else null
        MapUiState.SendRequest.Idle, MapUiState.SendRequest.Waiting -> null
    }
    if (message != null) MyGameInlineAlert(message = message, modifier = modifier)
}
