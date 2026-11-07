package com.emm.mygame.core.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.withTabularFigures

@Composable
fun SchoolPath(steps: SchoolPathSteps, modifier: Modifier = Modifier) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        PathRow(first = steps.studied, second = steps.read)
        PathRow(first = steps.reviewed, second = steps.learned)
    }
}

@Composable
private fun PathRow(first: SchoolPathSteps.Step, second: SchoolPathSteps.Step, modifier: Modifier = Modifier) {
    Row(horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step4), modifier = modifier.fillMaxWidth()) {
        PathStep(step = first, modifier = Modifier.weight(1f))
        PathStep(step = second, modifier = Modifier.weight(1f))
    }
}

@Composable
private fun PathStep(step: SchoolPathSteps.Step, modifier: Modifier = Modifier) {
    Column(modifier = modifier.semantics(mergeDescendants = true) { }) {
        MyGameText(text = step.label, style = MyGameTypography.caption, color = MyGameTheme.colors.inkMuted)
        MyGameText(
            text = step.count,
            style = MyGameTypography.body.withTabularFigures(),
            color = MyGameTheme.colors.ink,
        )
    }
}
