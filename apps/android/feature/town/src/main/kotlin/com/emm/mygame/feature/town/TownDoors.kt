package com.emm.mygame.feature.town

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.MyGameOutlinedButton
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.rememberPlayerCopy

@Composable
internal fun TownDoors(onSchoolOpen: () -> Unit, modifier: Modifier = Modifier) {
    val copy: PlayerCopy = rememberPlayerCopy()
    MyGameOutlinedButton(
        label = copy.chrome(R.string.town_place_school),
        isBusy = false,
        busyDescription = copy.chrome(R.string.town_waiting).spoken,
        onClick = onSchoolOpen,
        modifier = modifier.fillMaxWidth(),
    )
}
