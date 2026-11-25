package com.emm.mygame.feature.today

sealed interface TodayEffect {

    data object NoTown : TodayEffect
}
