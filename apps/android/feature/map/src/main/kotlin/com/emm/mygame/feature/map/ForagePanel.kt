package com.emm.mygame.feature.map

import android.content.res.Resources
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalResources
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import com.emm.mygame.core.designsystem.MyGameButton
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.designsystem.MyGameRadii
import com.emm.mygame.core.designsystem.MyGameSizes
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTextField
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.network.UnitCount

@Composable
internal fun ForageAction(plot: Int, onIntent: (MapIntent) -> Unit, modifier: Modifier = Modifier) {
    val resources: Resources = LocalResources.current
    MyGameButton(
        label = resources.getString(R.string.forage_send),
        isBusy = false,
        busyDescription = resources.getString(R.string.forage_waiting),
        onClick = { onIntent(MapIntent.ForageToggled(plot)) },
        accessibleName = resources.forageActionNameOf(plot),
        modifier = modifier,
    )
}

@Composable
internal fun ForageFormView(form: MapUiState.ForageForm, onIntent: (MapIntent) -> Unit, modifier: Modifier = Modifier) {
    val resources: Resources = LocalResources.current
    val reason: String? = form.block?.let { block: MapUiState.ForageBlock -> resources.blockLineOf(block) }
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier.fillMaxWidth()) {
        MyGameText(
            text = resources.forageTitleOf(form.target),
            style = MyGameTypography.brand,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { heading() },
        )
        form.atHome.forEach { home: UnitCount ->
            MyGameText(
                text = resources.atHomeOf(home),
                style = MyGameTypography.label,
                color = MyGameTheme.colors.inkMuted,
            )
        }
        PartyFields(form = form, onIntent = onIntent)
        ForagePreviewLines(form = form)
        MyGameButton(
            label = resources.getString(R.string.forage_send),
            isBusy = form.send == MapUiState.SendStatus.Waiting,
            busyDescription = resources.getString(R.string.forage_waiting),
            onClick = { onIntent(MapIntent.SendTapped) },
            blockedReason = reason,
        )
        if (reason != null) {
            MyGameText(
                text = reason,
                style = MyGameTypography.body,
                color = MyGameTheme.colors.rust,
                modifier = Modifier.clearAndSetSemantics { },
            )
        }
        SendAnswer(form = form)
    }
}

@Composable
internal fun SentForageView(sent: MapUiState.SentForage, modifier: Modifier = Modifier) {
    val shape: RoundedCornerShape = RoundedCornerShape(MyGameRadii.md)
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
        modifier = modifier
            .fillMaxWidth()
            .background(MyGameTheme.colors.mossSoft, shape)
            .border(MyGameSizes.hairline, MyGameTheme.colors.moss, shape)
            .padding(horizontal = MyGameSpacing.step3, vertical = MyGameSpacing.step2)
            .semantics(mergeDescendants = true) { liveRegion = LiveRegionMode.Polite },
    ) {
        LocalResources.current.sentLinesOf(sent).forEach { line: String ->
            MyGameText(text = line, style = MyGameTypography.body, color = MyGameTheme.colors.ink)
        }
    }
}

@Composable
private fun PartyFields(form: MapUiState.ForageForm, onIntent: (MapIntent) -> Unit, modifier: Modifier = Modifier) {
    val resources: Resources = LocalResources.current
    val numeric: KeyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number, imeAction = ImeAction.Next)
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        form.entries.forEach { party: MapUiState.PartyEntry ->
            MyGameTextField(
                value = party.entry,
                label = resources.partyFieldOf(party.unit),
                isSecret = false,
                isReadOnly = form.isFieldLocked,
                keyboardOptions = numeric,
                onValueChange = { entry: String -> onIntent(MapIntent.PartyEntryChanged(party.unit, entry)) },
            )
        }
        MyGameTextField(
            value = form.hoursEntry,
            label = resources.getString(R.string.forage_hours),
            isSecret = false,
            isReadOnly = form.isFieldLocked,
            keyboardOptions = numeric.copy(imeAction = ImeAction.Done),
            onValueChange = { entry: String -> onIntent(MapIntent.HoursEntryChanged(entry)) },
            keyboardActions = KeyboardActions(onDone = { onIntent(MapIntent.SendTapped) }),
        )
    }
}

@Composable
private fun ForagePreviewLines(form: MapUiState.ForageForm, modifier: Modifier = Modifier) {
    val preview: MapUiState.ForagePreview = form.preview ?: return
    val resources: Resources = LocalResources.current
    val lines: List<String> = listOfNotNull(
        resources.roadLineOf(preview.road),
        resources.returnLineOf(preview.returnIn),
        if (preview.loot.isEmpty()) null else resources.lootLineOf(preview.loot),
    )
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1), modifier = modifier) {
        lines.forEach { line: String ->
            MyGameText(text = line, style = MyGameTypography.body, color = MyGameTheme.colors.ink)
        }
    }
}

@Composable
private fun SendAnswer(form: MapUiState.ForageForm, modifier: Modifier = Modifier) {
    val resources: Resources = LocalResources.current
    val message: String? = when (val send: MapUiState.SendStatus = form.send) {
        is MapUiState.SendStatus.Refused -> resources.refusalLineOf(send.refusal)
        MapUiState.SendStatus.Unreachable -> resources.getString(R.string.map_unreachable)
        MapUiState.SendStatus.Idle, MapUiState.SendStatus.Waiting -> null
    }
    if (message != null) MyGameInlineAlert(message = message, modifier = modifier)
}
