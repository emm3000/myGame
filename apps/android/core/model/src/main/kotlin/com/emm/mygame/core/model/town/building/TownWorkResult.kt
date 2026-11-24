package com.emm.mygame.core.model.town.building

import com.emm.mygame.core.model.town.TownSnapshot

sealed interface TownWorkResult {

    data class Answered(val town: TownSnapshot) : TownWorkResult

    data class Refused(val refusal: TownWorkRefusal) : TownWorkResult

    data object Unreachable : TownWorkResult
}
