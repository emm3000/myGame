package com.emm.mygame.feature.report

sealed interface ReportEffect {

    data object SigningOut : ReportEffect

    data object SignedOut : ReportEffect
}
