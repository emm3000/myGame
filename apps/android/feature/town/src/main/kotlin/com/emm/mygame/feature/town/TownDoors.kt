package com.emm.mygame.feature.town

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import com.emm.mygame.core.designsystem.MyGameOutlinedButton
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.formatQuantity
import com.emm.mygame.core.ui.icuStringResource

@Composable
internal fun TownDoors(
    dueCount: Int,
    onSchoolOpen: () -> Unit,
    onReportOpen: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val busyDescription: String = stringResource(R.string.town_waiting)
    val report: String = stringResource(R.string.town_door_report)
    val figure: String = formatQuantity(dueCount.toLong())
    val due: String = icuStringResource(R.string.town_next_reviews_due, "count" to figure)
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
            label = report,
            isBusy = false,
            busyDescription = busyDescription,
            onClick = onReportOpen,
            modifier = Modifier.weight(1f),
            accessibleName = if (dueCount > 0) "$report $due" else null,
            badge = if (dueCount > 0) figure else null,
        )
    }
}
