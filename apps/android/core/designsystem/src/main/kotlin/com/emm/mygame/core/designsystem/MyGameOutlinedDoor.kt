package com.emm.mygame.core.designsystem

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.AnnotatedString

@Composable
fun MyGameOutlinedDoor(
    label: MyGameLabel,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    caption: MyGameLabel? = null,
    labelLineOf: (String) -> AnnotatedString = ::AnnotatedString,
) {
    MyGamePill(
        look = outlinedDoorLook(MyGameTheme.colors),
        label = label,
        isBusy = false,
        busyDescription = label,
        onClick = onClick,
        modifier = modifier,
        labelLineOf = labelLineOf,
        caption = caption,
    )
}

internal fun outlinedDoorLook(colors: MyGameColors): MyGamePillLook =
    outlinedPillLook(colors = colors, height = MyGameSizes.secondary).copy(hasForwardChevron = true)

@PreviewMyGame
@Composable
private fun MyGameOutlinedDoorPreview() {
    MyGamePreviewSurface {
        MyGameOutlinedDoor(label = MyGameLabel(text = "Read all the news", translation = null), onClick = {})
        MyGameOutlinedDoor(
            label = MyGameLabel(text = "Go to your lessons", translation = "Ir a tus lecciones"),
            onClick = {},
        )
        MyGameOutlinedDoor(
            label = MyGameLabel(text = "Open the check", translation = null),
            caption = MyGameLabel(text = "Band 2, week 8", translation = null),
            onClick = {},
        )
    }
}
