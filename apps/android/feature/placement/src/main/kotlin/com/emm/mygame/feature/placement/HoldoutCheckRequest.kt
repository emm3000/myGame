package com.emm.mygame.feature.placement

import com.emm.mygame.core.network.HoldoutCheckRefusal

sealed interface HoldoutCheckRequest {

    data object Idle : HoldoutCheckRequest

    data class Waiting(val action: HoldoutCheckAction) : HoldoutCheckRequest

    data class Refused(val refusal: HoldoutCheckRefusal) : HoldoutCheckRequest

    data object Unreachable : HoldoutCheckRequest
}
