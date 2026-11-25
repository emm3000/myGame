package com.emm.mygame.feature.learning.reviews

sealed interface ReviewEffect {

    data object Answered : ReviewEffect
}
