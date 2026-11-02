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
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation

@Composable
fun MyGameTextField(
    value: String,
    label: String,
    isSecret: Boolean,
    isReadOnly: Boolean,
    keyboardOptions: KeyboardOptions,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors: MyGameColors = MyGameTheme.colors
    val shape: Shape = RoundedCornerShape(MyGameRadii.md)
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1), modifier = modifier.fillMaxWidth()) {
        MyGameText(text = label.uppercase(), style = MyGameTypography.label, color = colors.inkMuted)
        BasicTextField(
            value = value,
            onValueChange = onValueChange,
            readOnly = isReadOnly,
            singleLine = true,
            textStyle = MyGameTypography.body.copy(color = colors.ink),
            cursorBrush = SolidColor(colors.ink),
            keyboardOptions = keyboardOptions,
            visualTransformation = if (isSecret) PasswordVisualTransformation() else VisualTransformation.None,
            modifier = Modifier
                .fillMaxWidth()
                .semantics { contentDescription = label },
            decorationBox = { field ->
                Box(
                    contentAlignment = Alignment.CenterStart,
                    modifier = Modifier
                        .defaultMinSize(minHeight = MyGameSizes.control)
                        .background(colors.surfaceRaised, shape)
                        .border(MyGameSizes.hairline, colors.lineStrong, shape)
                        .padding(horizontal = MyGameSpacing.step3),
                ) {
                    field()
                }
            },
        )
    }
}
