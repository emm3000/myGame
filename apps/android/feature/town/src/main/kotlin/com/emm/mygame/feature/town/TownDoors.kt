package com.emm.mygame.feature.town

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.MyGameOutlinedButton
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.formatQuantity
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.rememberPlayerCopy

private fun PlayerCopy.reportWithDue(figure: String): String = chrome {
    "${text(R.string.town_door_report)} ${text(R.string.town_next_reviews_due, "count" to figure)}"
}.spoken

@Composable
internal fun TownDoors(
    dueCount: Int,
    onSchoolOpen: () -> Unit,
    onReportOpen: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val copy: PlayerCopy = rememberPlayerCopy()
    val busyDescription: String = copy.chrome(R.string.town_waiting).spoken
    val figure: String = formatQuantity(dueCount.toLong())
    Row(
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
        modifier = modifier.fillMaxWidth(),
    ) {
        MyGameOutlinedButton(
            label = copy.chrome(R.string.town_place_school),
            isBusy = false,
            busyDescription = busyDescription,
            onClick = onSchoolOpen,
            modifier = Modifier.weight(1f),
        )
        MyGameOutlinedButton(
            label = copy.chrome(R.string.town_door_report),
            isBusy = false,
            busyDescription = busyDescription,
            onClick = onReportOpen,
            modifier = Modifier.weight(1f),
            accessibleName = if (dueCount > 0) copy.reportWithDue(figure) else null,
            badge = if (dueCount > 0) figure else null,
        )
    }
}
