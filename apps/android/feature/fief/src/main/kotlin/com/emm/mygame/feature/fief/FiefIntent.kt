package com.emm.mygame.feature.fief

sealed interface FiefIntent {

    data object RetryTapped : FiefIntent
}
