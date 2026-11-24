package com.emm.mygame.feature.town.naming

import com.emm.mygame.core.model.town.TownFoundRefusal

sealed interface NamingStatus {

    data object Idle : NamingStatus

    data object Submitting : NamingStatus

    data class Refused(val refusal: TownFoundRefusal) : NamingStatus

    data object Unreachable : NamingStatus
}
