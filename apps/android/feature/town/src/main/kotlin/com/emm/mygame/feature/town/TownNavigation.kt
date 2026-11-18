package com.emm.mygame.feature.town

data class TownNavigation(
    val onSchoolOpen: () -> Unit,
    val onMapOpen: () -> Unit,
    val onSigningOut: () -> Unit,
    val onSignedOut: () -> Unit,
)
