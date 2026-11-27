package com.emm.mygame.core.designsystem.control

import androidx.compose.ui.tooling.preview.PreviewParameterProvider

internal data class MyGamePillState(
    val label: String,
    val isBusy: Boolean,
    val busyDescription: String,
    val blockedReason: String?,
)

internal class MyGamePillStates : PreviewParameterProvider<MyGamePillState> {

    override val values: Sequence<MyGamePillState> = sequenceOf(
        MyGamePillState(label = "Build the farm", isBusy = false, busyDescription = "Building", blockedReason = null),
        MyGamePillState(
            label = "Build the farm",
            isBusy = false,
            busyDescription = "Building",
            blockedReason = "Not enough material",
        ),
        MyGamePillState(label = "Build the farm", isBusy = true, busyDescription = "Building", blockedReason = null),
        MyGamePillState(
            label = "Study lesson 1 of the school · 2:30",
            isBusy = false,
            busyDescription = "Studying",
            blockedReason = null,
        ),
    )
}
