package com.emm.mygame.core.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.autofill.ContentType
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.contentType
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider

@Composable
fun MyGameTextField(
    value: String,
    label: String,
    isSecret: Boolean,
    isReadOnly: Boolean,
    keyboardOptions: KeyboardOptions,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    keyboardActions: KeyboardActions = KeyboardActions.Default,
    contentType: ContentType? = null,
    supportingText: String? = null,
    isEnabled: Boolean = true,
) {
    MyGameTextField(
        value = value,
        label = MyGameLabel(text = label, translation = null),
        isSecret = isSecret,
        isReadOnly = isReadOnly,
        keyboardOptions = keyboardOptions,
        onValueChange = onValueChange,
        modifier = modifier,
        keyboardActions = keyboardActions,
        contentType = contentType,
        supportingText = supportingText,
        isEnabled = isEnabled,
    )
}

@Composable
fun MyGameTextField(
    value: String,
    label: MyGameLabel,
    isSecret: Boolean,
    isReadOnly: Boolean,
    keyboardOptions: KeyboardOptions,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    keyboardActions: KeyboardActions = KeyboardActions.Default,
    contentType: ContentType? = null,
    supportingText: String? = null,
    isEnabled: Boolean = true,
) {
    val colors: MyGameColors = MyGameTheme.colors
    val shape: Shape = RoundedCornerShape(MyGameRadii.md)
    val hiddenWhenTranslated: Modifier = if (label.translation == null) Modifier else Modifier.clearAndSetSemantics { }
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1), modifier = modifier.fillMaxWidth()) {
        MyGameText(
            label = label,
            style = MyGameTypography.label,
            color = colors.inkMuted,
            modifier = hiddenWhenTranslated,
        )
        BasicTextField(
            value = value,
            onValueChange = onValueChange,
            enabled = isEnabled,
            readOnly = isReadOnly,
            singleLine = true,
            textStyle = MyGameTypography.body.copy(color = if (isEnabled) colors.ink else colors.inkMuted),
            cursorBrush = SolidColor(colors.ink),
            keyboardOptions = keyboardOptions,
            keyboardActions = keyboardActions,
            visualTransformation = if (isSecret) PasswordVisualTransformation() else VisualTransformation.None,
            modifier = Modifier
                .fillMaxWidth()
                .semantics {
                    contentDescription = label.spoken
                    if (contentType != null) this.contentType = contentType
                },
            decorationBox = { field ->
                Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1)) {
                    Box(
                        contentAlignment = Alignment.CenterStart,
                        modifier = Modifier
                            .fillMaxWidth()
                            .defaultMinSize(minHeight = MyGameSizes.control)
                            .background(if (isEnabled) colors.surfaceRaised else colors.surfaceSunken, shape)
                            .border(MyGameStrokeWidths.hairline, colors.lineStrong, shape)
                            .padding(horizontal = MyGameSpacing.step3),
                    ) {
                        field()
                    }
                    if (supportingText != null) {
                        MyGameText(text = supportingText, style = MyGameTypography.body, color = colors.inkMuted)
                    }
                }
            },
        )
    }
}

private data class TextFieldState(
    val value: String,
    val isSecret: Boolean,
    val isReadOnly: Boolean,
    val supportingText: String?,
    val isEnabled: Boolean,
)

private class TextFieldStates : PreviewParameterProvider<TextFieldState> {

    override val values: Sequence<TextFieldState> = sequenceOf(
        TextFieldState(value = "", isSecret = false, isReadOnly = false, supportingText = null, isEnabled = true),
        TextFieldState(value = "maple", isSecret = false, isReadOnly = false, supportingText = null, isEnabled = true),
        TextFieldState(
            value = "secret words",
            isSecret = true,
            isReadOnly = false,
            supportingText = "At least 8 characters.",
            isEnabled = true,
        ),
        TextFieldState(value = "maple", isSecret = false, isReadOnly = true, supportingText = null, isEnabled = true),
        TextFieldState(value = "12", isSecret = false, isReadOnly = false, supportingText = null, isEnabled = false),
    )
}

@PreviewMyGame
@Composable
private fun MyGameTextFieldPreview(@PreviewParameter(TextFieldStates::class) state: TextFieldState) {
    MyGamePreviewSurface {
        MyGameTextField(
            value = state.value,
            label = "Your answer",
            isSecret = state.isSecret,
            isReadOnly = state.isReadOnly,
            keyboardOptions = KeyboardOptions.Default,
            onValueChange = {},
            supportingText = state.supportingText,
            isEnabled = state.isEnabled,
        )
    }
}

@PreviewMyGame
@Composable
private fun MyGameTextFieldTranslatedPreview() {
    MyGamePreviewSurface {
        MyGameTextField(
            value = "Riverton",
            label = MyGameLabel(text = "Town name", translation = "Nombre del pueblo"),
            isSecret = false,
            isReadOnly = false,
            keyboardOptions = KeyboardOptions.Default,
            onValueChange = {},
        )
    }
}
