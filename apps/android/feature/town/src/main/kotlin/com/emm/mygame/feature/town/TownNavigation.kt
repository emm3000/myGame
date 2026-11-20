package com.emm.mygame.feature.town

import com.emm.mygame.core.network.TextId

data class TownNavigation(
    val onSchoolOpen: () -> Unit,
    val onMapOpen: () -> Unit,
    val onTextOpen: (TextId) -> Unit,
    val onSigningOut: () -> Unit,
    val onSignedOut: () -> Unit,
)
