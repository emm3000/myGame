package com.emm.mygame.feature.town

import com.emm.mygame.core.model.learning.TextId

data class TownNavigation(
    val onSchoolOpen: () -> Unit,
    val onMapOpen: () -> Unit,
    val onTextOpen: (TextId) -> Unit,
    val onSigningOut: () -> Unit,
    val onSignedOut: () -> Unit,
    val onUnnamed: () -> Unit,
    val onNamed: () -> Unit,
)
