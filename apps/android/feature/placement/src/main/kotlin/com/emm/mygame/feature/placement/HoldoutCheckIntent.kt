package com.emm.mygame.feature.placement

import com.emm.mygame.core.network.ChoiceId

sealed interface HoldoutCheckIntent {

    data object RetryTapped : HoldoutCheckIntent

    data object StartTapped : HoldoutCheckIntent

    data object SkipTapped : HoldoutCheckIntent

    data class ChoiceChosen(val choice: ChoiceId) : HoldoutCheckIntent

    data object NextTapped : HoldoutCheckIntent

    data object AnswersSent : HoldoutCheckIntent
}
