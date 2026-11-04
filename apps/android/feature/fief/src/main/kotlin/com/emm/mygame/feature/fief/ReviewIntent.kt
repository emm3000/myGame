package com.emm.mygame.feature.fief

import com.emm.mygame.core.network.ChoiceId

sealed interface ReviewIntent {

    data object RetryTapped : ReviewIntent

    data class ChoiceChosen(val choice: ChoiceId) : ReviewIntent

    data class AnswerChanged(val answer: String) : ReviewIntent

    data object HintTapped : ReviewIntent

    data object CheckTapped : ReviewIntent

    data object NextTapped : ReviewIntent
}
