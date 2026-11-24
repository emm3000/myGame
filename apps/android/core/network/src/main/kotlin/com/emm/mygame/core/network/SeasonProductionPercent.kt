package com.emm.mygame.core.network

import com.emm.mygame.core.model.town.TownResourceKind

data class SeasonProductionPercent(val money: Int, val food: Int, val power: Int, val material: Int) {

    fun of(resource: TownResourceKind): Int = when (resource) {
        TownResourceKind.Money -> money
        TownResourceKind.Food -> food
        TownResourceKind.Power -> power
        TownResourceKind.Material -> material
    }
}
