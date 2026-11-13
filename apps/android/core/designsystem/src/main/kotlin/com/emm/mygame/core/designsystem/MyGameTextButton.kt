package com.emm.mygame.core.designsystem

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.style.TextDecoration

@Composable
fun MyGameTextButton(
    label: String,
    isBusy: Boolean,
    busyDescription: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    MyGameTextButton(
        label = MyGameLabel(text = label, translation = null),
        isBusy = isBusy,
        busyDescription = busyDescription,
        onClick = onClick,
        modifier = modifier,
    )
}

@Composable
fun MyGameTextButton(
    label: MyGameLabel,
    isBusy: Boolean,
    busyDescription: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors: MyGameColors = MyGameTheme.colors
    MyGameTextTarget(
        isEnabled = !isBusy,
        onClick = onClick,
        modifier = modifier.semantics(mergeDescendants = true) {
            if (isBusy) stateDescription = busyDescription
        },
    ) {
        MyGameText(
            label = label,
            style = MyGameTypography.label.copy(textDecoration = TextDecoration.Underline),
            color = if (isBusy) colors.inkMuted else colors.ink,
        )
    }
}

@PreviewMyGame
@Composable
private fun MyGameTextButtonPreview() {
    MyGamePreviewSurface {
        MyGameTextButton(label = "Sign out", isBusy = false, busyDescription = "Signing out", onClick = {})
        MyGameTextButton(label = "Sign out", isBusy = true, busyDescription = "Signing out", onClick = {})
    }
}
