package com.emm.mygame.feature.town

import androidx.compose.runtime.Composable
import com.emm.mygame.core.network.TextId

internal class TownPageSlots(
    val ring: @Composable () -> Unit,
    val status: @Composable () -> Unit,
    val placement: @Composable () -> Unit,
    val onSchoolOpen: () -> Unit,
    val onMapOpen: () -> Unit,
    val onTextOpen: (TextId) -> Unit,
)
