package com.emm.mygame.core.designsystem

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign

@Composable
fun MyGameTimeField(
    time: String,
    hourEarlier: MyGameTimeStep,
    hourLater: MyGameTimeStep,
    minutesEarlier: MyGameTimeStep,
    minutesLater: MyGameTimeStep,
    modifier: Modifier = Modifier,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier.fillMaxWidth()) {
        MyGameText(
            text = time,
            style = MyGameTypography.numeral.copy(textAlign = TextAlign.Center),
            color = MyGameTheme.colors.ink,
            modifier = Modifier
                .fillMaxWidth()
                .semantics { liveRegion = LiveRegionMode.Polite },
        )
        TimeStepPair(earlier = hourEarlier, later = hourLater)
        TimeStepPair(earlier = minutesEarlier, later = minutesLater)
    }
}

@Composable
private fun TimeStepPair(earlier: MyGameTimeStep, later: MyGameTimeStep, modifier: Modifier = Modifier) {
    Row(horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier.fillMaxWidth()) {
        TimeStepButton(step = earlier, modifier = Modifier.weight(1f))
        TimeStepButton(step = later, modifier = Modifier.weight(1f))
    }
}

@Composable
private fun TimeStepButton(step: MyGameTimeStep, modifier: Modifier = Modifier) {
    MyGameOutlinedButton(
        label = step.label,
        isBusy = false,
        busyDescription = step.accessibleName,
        onClick = step.onClick,
        modifier = modifier,
        accessibleName = step.accessibleName,
    )
}

private fun previewStep(label: String, accessibleName: String): MyGameTimeStep =
    MyGameTimeStep(label = MyGameLabel(text = label, translation = null), accessibleName = accessibleName, onClick = {})

@PreviewMyGame
@Composable
private fun MyGameTimeFieldPreview() {
    MyGamePreviewSurface {
        MyGameTimeField(
            time = "7:00\u202FPM",
            hourEarlier = previewStep(label = "−1 hour", accessibleName = "One hour earlier"),
            hourLater = previewStep(label = "+1 hour", accessibleName = "One hour later"),
            minutesEarlier = previewStep(label = "−5 minutes", accessibleName = "Five minutes earlier"),
            minutesLater = previewStep(label = "+5 minutes", accessibleName = "Five minutes later"),
        )
        MyGameTimeField(
            time = "11:55\u202FPM",
            hourEarlier = previewStep(
                label = "One hour earlier than the time you picked",
                accessibleName = "One hour earlier",
            ),
            hourLater = previewStep(label = "One hour later", accessibleName = "One hour later"),
            minutesEarlier = previewStep(label = "Five minutes earlier", accessibleName = "Five minutes earlier"),
            minutesLater = previewStep(label = "Five minutes later", accessibleName = "Five minutes later"),
        )
    }
}
