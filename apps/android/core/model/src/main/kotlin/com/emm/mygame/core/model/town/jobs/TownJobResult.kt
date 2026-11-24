package com.emm.mygame.core.model.town.jobs

import com.emm.mygame.core.model.town.TownSnapshot

sealed interface TownJobResult {

    data class Answered(val town: TownSnapshot) : TownJobResult

    data class Refused(val refusal: TownJobRefusal) : TownJobResult

    data object Unreachable : TownJobResult
}
