package com.emm.mygame.feature.town

import androidx.compose.runtime.Composable

internal class TownPageSlots(
    val ring: @Composable () -> Unit,
    val status: @Composable () -> Unit,
    val placement: @Composable () -> Unit,
    val onSchoolOpen: () -> Unit,
    val onMapOpen: () -> Unit,
)
