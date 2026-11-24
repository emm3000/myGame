package com.emm.mygame.feature.learning

sealed interface ReviewEffect {

    data object Answered : ReviewEffect
}
