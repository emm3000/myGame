package com.emm.mygame.core.model.town.hiring

import com.emm.mygame.core.model.town.TownSnapshot

sealed interface TownHiringResult {

    data class Answered(val town: TownSnapshot) : TownHiringResult

    data class Refused(val refusal: TownHiringRefusal) : TownHiringResult

    data object Unreachable : TownHiringResult
}
