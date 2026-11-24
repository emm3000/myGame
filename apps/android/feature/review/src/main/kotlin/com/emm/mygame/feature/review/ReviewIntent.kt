package com.emm.mygame.feature.review

import com.emm.mygame.core.model.placement.ChoiceId

sealed interface ReviewIntent {

    data object ScreenShown : ReviewIntent

    data object ScreenHidden : ReviewIntent

    data object RetryTapped : ReviewIntent

    data class ChoiceChosen(val choice: ChoiceId) : ReviewIntent

    data class AnswerChanged(val answer: String) : ReviewIntent

    data class SupportTapped(val spanIndex: Int) : ReviewIntent

    data object HintTapped : ReviewIntent

    data object CheckTapped : ReviewIntent

    data object NextTapped : ReviewIntent

    data object ReviewsStartTapped : ReviewIntent
}
