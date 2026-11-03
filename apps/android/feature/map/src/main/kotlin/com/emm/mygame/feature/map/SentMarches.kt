package com.emm.mygame.feature.map

import com.emm.mygame.core.network.AwayMarch
import com.emm.mygame.core.network.FiefSnapshot
import com.emm.mygame.core.network.MarchCamp
import com.emm.mygame.core.network.MarchOrder
import com.emm.mygame.core.network.UnitCount

internal fun FiefSnapshot.sentMarch(): MapUiState.SentMarch? {
    val away: AwayMarch = march ?: return null
    val units: List<UnitCount> = away.units.filter { count: UnitCount -> count.count > 0 }
    val camp: MarchCamp? = away.camp
    return when (away.order) {
        MarchOrder.Forage -> MapUiState.SentForage(away.target, units, away.returnsAt - readAt, away.loot)
        MarchOrder.Attack -> camp?.let { attacked: MarchCamp ->
            MapUiState.SentAttack(away.target, units, attacked, away.returnsAt - readAt, away.loot)
        }
        MarchOrder.Found -> away.foundingName?.let { name: String ->
            MapUiState.SentFounding(away.target, units, name, away.arrivesAt - readAt)
        }
        MarchOrder.Transport -> MapUiState.SentTransport(away.target, units, away.cargo, away.arrivesAt - readAt)
    }
}
