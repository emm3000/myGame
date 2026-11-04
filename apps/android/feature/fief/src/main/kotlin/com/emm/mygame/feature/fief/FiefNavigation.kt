package com.emm.mygame.feature.fief

data class FiefNavigation(
    val onSigningOut: () -> Unit,
    val onSignedOut: () -> Unit,
    val onNewFief: () -> Unit,
    val onReviewOpen: () -> Unit,
)
