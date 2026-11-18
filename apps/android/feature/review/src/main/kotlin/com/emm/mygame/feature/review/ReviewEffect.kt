package com.emm.mygame.feature.review

sealed interface ReviewEffect {

    data object Answered : ReviewEffect
}
