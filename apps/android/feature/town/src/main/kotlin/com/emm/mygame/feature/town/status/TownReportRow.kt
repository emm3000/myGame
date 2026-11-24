package com.emm.mygame.feature.town.status

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.MyGameNavRow
import com.emm.mygame.core.model.town.guidance.NextStepCard
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.feature.town.R

@Composable
fun TownReportRow(dock: TownStatusUiState.Dock, onClick: () -> Unit, modifier: Modifier = Modifier) {
    if (dock.opensReport()) return
    MyGameNavRow(title = chromeResource(R.string.town_door_report), onClick = onClick, modifier = modifier)
}

private fun TownStatusUiState.Dock.opensReport(): Boolean {
    val step: TownStatusUiState.Dock.Step = this as? TownStatusUiState.Dock.Step ?: return false
    return step.go.action == NextStepCard.Action.GoToReport
}

private val TownStatusUiState.Go.action: NextStepCard.Action
    get() = when (this) {
        is TownStatusUiState.Go.Acts -> action
        is TownStatusUiState.Go.ActsInPlace -> action
        is TownStatusUiState.Go.Blocked -> action
    }
