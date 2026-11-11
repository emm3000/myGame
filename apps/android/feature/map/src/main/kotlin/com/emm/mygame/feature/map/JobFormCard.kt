package com.emm.mygame.feature.map

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.hideFromAccessibility
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import com.emm.mygame.core.designsystem.MyGameButton
import com.emm.mygame.core.designsystem.MyGameCard
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTextField
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.ui.icuStringResource

@Composable
internal fun JobFormCard(
    form: MapUiState.JobForm,
    send: MapUiState.SendRequest,
    onIntent: (MapIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val reason: String? = form.block?.let { block: MapUiState.JobBlock -> jobBlockLineOf(block) }
    MyGameCard(modifier = modifier) {
        Column(
            verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
            modifier = Modifier.padding(vertical = MyGameSpacing.step4),
        ) {
            MyGameText(
                text = icuStringResource(R.string.map_job_title, "site" to form.site.toString()),
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
            JobField(
                value = form.hours,
                label = stringResource(R.string.map_job_hours),
                field = MapIntent.JobField.Hours,
                onIntent = onIntent,
            )
            MyGameButton(
                label = stringResource(R.string.map_job_send),
                isBusy = send == MapUiState.SendRequest.Waiting,
                busyDescription = stringResource(R.string.map_waiting),
                onClick = { onIntent(MapIntent.SendTapped) },
                blockedReason = reason,
            )
            reason?.takeUnless { send.isAnsweredFor(form.site) }?.let { line: String ->
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
private fun JobField(
    value: String,
    label: String,
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

private fun MapUiState.SendRequest.isAnsweredFor(site: Int): Boolean = when (this) {
    is MapUiState.SendRequest.Refused -> this.site == site
    is MapUiState.SendRequest.Unreachable -> this.site == site
    MapUiState.SendRequest.Idle, MapUiState.SendRequest.Waiting -> false
}

@Composable
private fun SendAnswer(site: Int, send: MapUiState.SendRequest, modifier: Modifier = Modifier) {
    val message: String? = when (send) {
        is MapUiState.SendRequest.Refused -> if (send.site == site) jobRefusalLineOf(send.refusal) else null
        is MapUiState.SendRequest.Unreachable ->
            if (send.site == site) stringResource(R.string.map_refusal_unexpected) else null
        MapUiState.SendRequest.Idle, MapUiState.SendRequest.Waiting -> null
    }
    if (message != null) MyGameInlineAlert(message = message, modifier = modifier)
}
