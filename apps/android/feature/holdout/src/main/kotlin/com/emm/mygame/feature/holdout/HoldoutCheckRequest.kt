package com.emm.mygame.feature.holdout

import com.emm.mygame.core.model.holdout.HoldoutCheckRefusal

sealed interface HoldoutCheckRequest {

    data object Idle : HoldoutCheckRequest

    data class Waiting(val action: HoldoutCheckAction) : HoldoutCheckRequest

    data class Refused(val action: HoldoutCheckAction, val refusal: HoldoutCheckRefusal) : HoldoutCheckRequest

    data class Unreachable(val action: HoldoutCheckAction) : HoldoutCheckRequest

    val isSkipVerdict: Boolean
        get() = when (this) {
            Idle, is Waiting -> false
            is Refused -> action == HoldoutCheckAction.Skip
            is Unreachable -> action == HoldoutCheckAction.Skip
        }
}
