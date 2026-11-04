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
import androidx.compose.ui.focus.FocusManager
import androidx.compose.ui.platform.LocalFocusManager
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
import com.emm.mygame.core.network.Terrain
import com.emm.mygame.core.network.UnitCount
import com.emm.mygame.core.network.UnitKind

@Composable
internal fun OrderAction(
    plot: Int,
    order: MapUiState.OfferedOrder,
    terrain: Terrain,
    onIntent: (MapIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val resources: Resources = LocalResources.current
    MyGameButton(
        label = resources.actionLabelOf(order),
        isBusy = false,
        busyDescription = resources.getString(R.string.forage_waiting),
        onClick = {
            onIntent(
                when (order) {
                    MapUiState.OfferedOrder.Forage -> MapIntent.ForageToggled(plot)
                    MapUiState.OfferedOrder.Attack -> MapIntent.AttackToggled(plot)
                    MapUiState.OfferedOrder.Found -> MapIntent.FoundingToggled(plot, resources.proposedNameOf(terrain))
                    MapUiState.OfferedOrder.Transport -> MapIntent.TransportToggled(plot)
                },
            )
        },
        accessibleName = resources.actionNameOf(order, plot),
        modifier = modifier,
    )
}

@Composable
internal fun MarchFormView(form: MapUiState.MarchForm, onIntent: (MapIntent) -> Unit, modifier: Modifier = Modifier) {
    val resources: Resources = LocalResources.current
    val reason: String? = form.block?.let { block: MapUiState.MarchBlock -> resources.blockLineOf(block) }
    val focusManager: FocusManager = LocalFocusManager.current
    val send: () -> Unit = {
        focusManager.clearFocus()
        onIntent(MapIntent.SendTapped)
    }
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier.fillMaxWidth()) {
        MyGameText(
            text = resources.titleOf(form),
            style = MyGameTypography.brand,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { heading() },
        )
        atHomeOf(form).forEach { home: UnitCount ->
            MyGameText(
                text = resources.atHomeOf(home),
                style = MyGameTypography.label,
                color = MyGameTheme.colors.inkMuted,
            )
        }
        FormFields(form = form, onIntent = onIntent, onSend = send)
        resources.previewLinesOf(form).forEach { line: String ->
            MyGameText(text = line, style = MyGameTypography.body, color = MyGameTheme.colors.ink)
        }
        MyGameButton(
            label = resources.sendLabelOf(form),
            isBusy = form.send == MapUiState.SendStatus.Waiting,
            busyDescription = resources.getString(R.string.forage_waiting),
            onClick = send,
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
        resources.sendAnswerOf(form.send)?.let { message: String -> MyGameInlineAlert(message = message) }
    }
}

@Composable
internal fun SentMarchView(sent: MapUiState.SentMarch, modifier: Modifier = Modifier) {
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
private fun FormFields(
    form: MapUiState.MarchForm,
    onIntent: (MapIntent) -> Unit,
    onSend: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val resources: Resources = LocalResources.current
    val numeric: KeyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number, imeAction = ImeAction.Next)
    val fields: List<FormField> = fieldsOf(form, resources)
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        fields.forEachIndexed { index: Int, field: FormField ->
            val isLast: Boolean = index == fields.lastIndex
            val options: KeyboardOptions = if (field.isNumeric) numeric else KeyboardOptions(imeAction = ImeAction.Next)
            MyGameTextField(
                value = field.value,
                label = field.label,
                isSecret = false,
                isReadOnly = form.isFieldLocked,
                keyboardOptions = if (isLast) options.copy(imeAction = ImeAction.Done) else options,
                onValueChange = { entry: String -> onIntent(field.changed(entry)) },
                keyboardActions = KeyboardActions(onDone = { onSend() }),
            )
        }
    }
}

private class FormField(
    val label: String,
    val value: String,
    val isNumeric: Boolean,
    val changed: (String) -> MapIntent,
)

private fun fieldsOf(form: MapUiState.MarchForm, resources: Resources): List<FormField> = when (form) {
    is MapUiState.ForageForm -> partyFieldsOf(form.entries, resources) + FormField(
        label = resources.getString(R.string.forage_hours),
        value = form.hoursEntry,
        isNumeric = true,
        changed = { entry: String -> MapIntent.HoursEntryChanged(entry) },
    )
    is MapUiState.AttackForm -> partyFieldsOf(form.entries, resources)
    is MapUiState.FoundingForm -> listOf(
        FormField(
            label = resources.getString(R.string.founding_name),
            value = form.nameEntry,
            isNumeric = false,
            changed = { entry: String -> MapIntent.NameEntryChanged(entry) },
        ),
    )
    is MapUiState.TransportForm -> partyFieldsOf(form.entries, resources) + form.cargoEntries.map { cargo ->
        FormField(
            label = resources.cargoFieldOf(cargo.kind),
            value = cargo.entry,
            isNumeric = true,
            changed = { entry: String -> MapIntent.CargoEntryChanged(cargo.kind, entry) },
        )
    }
}

private fun partyFieldsOf(entries: List<MapUiState.PartyEntry>, resources: Resources): List<FormField> =
    entries.map { party: MapUiState.PartyEntry ->
        FormField(
            label = resources.partyFieldOf(party.unit),
            value = party.entry,
            isNumeric = true,
            changed = { entry: String -> MapIntent.PartyEntryChanged(party.unit, entry) },
        )
    }

private fun atHomeOf(form: MapUiState.MarchForm): List<UnitCount> = when (form) {
    is MapUiState.ForageForm -> form.atHome
    is MapUiState.AttackForm -> form.atHome
    is MapUiState.FoundingForm -> listOf(UnitCount(UnitKind.Settler, form.settlersAtHome))
    is MapUiState.TransportForm -> form.atHome
}

private fun Resources.previewLinesOf(form: MapUiState.MarchForm): List<String> = when (form) {
    is MapUiState.ForageForm -> form.preview?.let { preview -> forageLinesOf(preview) }
    is MapUiState.AttackForm -> form.preview?.let { preview -> attackLinesOf(preview) }
    is MapUiState.FoundingForm -> form.preview?.let { preview -> foundingLinesOf(preview) }
    is MapUiState.TransportForm -> form.preview?.let { preview -> transportLinesOf(preview) }
}.orEmpty()
