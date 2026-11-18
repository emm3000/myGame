package com.emm.mygame.feature.report

data class ReportNavigation(
    val onNewsOpen: () -> Unit,
    val onSettingsOpen: () -> Unit,
    val onSigningOut: () -> Unit,
    val onSignedOut: () -> Unit,
    val onNewsClosed: () -> Unit,
)
