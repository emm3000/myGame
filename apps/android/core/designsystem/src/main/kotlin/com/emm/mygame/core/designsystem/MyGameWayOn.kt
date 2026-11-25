package com.emm.mygame.core.designsystem

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.PreviewParameter

@Composable
fun MyGameWayOn(
    label: MyGameLabel,
    isBusy: Boolean,
    busyDescription: MyGameLabel,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    blockedReason: MyGameLabel? = null,
    verdict: @Composable () -> Unit = {},
) {
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
        modifier = modifier.fillMaxWidth(),
    ) {
        verdict()
        MyGameButton(
            label = label,
            isBusy = isBusy,
            busyDescription = busyDescription,
            onClick = onClick,
            blockedReason = blockedReason,
        )
    }
}

@PreviewMyGame
@Composable
private fun MyGameWayOnPreview(@PreviewParameter(MyGamePillStates::class) state: MyGamePillState) {
    MyGamePreviewSurface {
        MyGameWayOn(
            label = MyGameLabel(text = state.label, translation = null),
            isBusy = state.isBusy,
            busyDescription = MyGameLabel(text = state.busyDescription, translation = null),
            onClick = {},
            blockedReason = state.blockedReason?.let { reason: String ->
                MyGameLabel(text = reason, translation = null)
            },
        )
    }
}

@PreviewMyGame
@Composable
private fun MyGameWayOnVerdictPreview() {
    MyGamePreviewSurface {
        MyGameWayOn(
            label = MyGameLabel(text = "Send band 1", translation = null),
            isBusy = false,
            busyDescription = MyGameLabel(text = "Sending…", translation = null),
            onClick = {},
            verdict = { MyGameInlineAlert(message = "We couldn't reach the server. Try again in a moment.") },
        )
    }
}
