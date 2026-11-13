package com.emm.mygame.feature.placement

sealed interface HoldoutCheckRequest {

    data object Idle : HoldoutCheckRequest

    data class Waiting(val action: HoldoutCheckAction) : HoldoutCheckRequest

    data object Refused : HoldoutCheckRequest

    data object Unreachable : HoldoutCheckRequest
}
