package com.emm.mygame.feature.report

sealed interface ReportEffect {

    data object SignedOut : ReportEffect
}
