package com.emm.mygame.core.designsystem

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.hideFromAccessibility
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.style.TextDecoration

@Composable
fun MyGameTextLink(label: String, onClick: () -> Unit, modifier: Modifier = Modifier) {
    MyGameTextLink(label = MyGameLabel(text = label, translation = null), onClick = onClick, modifier = modifier)
}

@Composable
fun MyGameTextLink(label: MyGameLabel, onClick: () -> Unit, modifier: Modifier = Modifier) {
    MyGameTextTarget(isEnabled = true, onClick = onClick, modifier = modifier) {
        MyGameTextLinkLabel(label = label)
    }
}

@Composable
fun MyGameTextLink(
    label: String,
    isBusy: Boolean,
    busyDescription: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    MyGameTextTarget(
        isEnabled = !isBusy,
        onClick = onClick,
        modifier = modifier.semantics(mergeDescendants = true) {
            if (isBusy) {
                contentDescription = label
                stateDescription = busyDescription
            }
        },
    ) {
        if (isBusy) {
            MyGameTextLinkWorking(busyDescription = busyDescription)
        } else {
            MyGameTextLinkLabel(label = MyGameLabel(text = label, translation = null))
        }
    }
}

@Composable
private fun MyGameTextLinkLabel(label: MyGameLabel) {
    MyGameText(
        label = label,
        style = MyGameTypography.label.copy(textDecoration = TextDecoration.Underline),
        color = MyGameTheme.colors.ink,
    )
}

@Composable
private fun MyGameTextLinkWorking(busyDescription: String) {
    val ink: Color = MyGameTheme.colors.ink
    Row(
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        MyGameWorkingDots(tint = ink)
        MyGameText(
            text = busyDescription,
            style = MyGameTypography.label,
            color = ink,
            modifier = Modifier.semantics { hideFromAccessibility() },
        )
    }
}

@Composable
internal fun MyGameTextTarget(
    isEnabled: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    Box(
        contentAlignment = Alignment.CenterStart,
        modifier = modifier
            .defaultMinSize(minWidth = MyGameSizes.control, minHeight = MyGameSizes.control)
            .clickable(enabled = isEnabled, role = Role.Button, onClick = onClick),
    ) {
        content()
    }
}

@PreviewMyGame
@Composable
private fun MyGameTextLinkPreview() {
    MyGamePreviewSurface {
        MyGameTextLink(label = "Open the map", onClick = {})
        MyGameTextLink(label = "Sign out", isBusy = true, busyDescription = "Signing out", onClick = {})
    }
}
