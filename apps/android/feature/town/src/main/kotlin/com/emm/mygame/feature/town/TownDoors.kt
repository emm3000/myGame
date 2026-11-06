package com.emm.mygame.feature.town

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import com.emm.mygame.core.designsystem.MyGameOutlinedButton
import com.emm.mygame.core.designsystem.MyGameSpacing

@Composable
internal fun TownDoors(onSchoolOpen: () -> Unit, onReportOpen: () -> Unit, modifier: Modifier = Modifier) {
    val busyDescription: String = stringResource(R.string.town_waiting)
    Row(
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
        modifier = modifier.fillMaxWidth(),
    ) {
        MyGameOutlinedButton(
            label = stringResource(R.string.town_place_school),
            isBusy = false,
            busyDescription = busyDescription,
            onClick = onSchoolOpen,
            modifier = Modifier.weight(1f),
        )
        MyGameOutlinedButton(
            label = stringResource(R.string.town_door_report),
            isBusy = false,
            busyDescription = busyDescription,
            onClick = onReportOpen,
            modifier = Modifier.weight(1f),
        )
    }
}
