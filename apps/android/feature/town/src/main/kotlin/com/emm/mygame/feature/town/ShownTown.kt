package com.emm.mygame.feature.town

import com.emm.mygame.core.model.town.TownRegistered
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.registeredBetween

internal data class ShownTown(val snapshot: TownSnapshot, val registered: TownRegistered) {

    fun followedBy(read: TownSnapshot): ShownTown = ShownTown(read, registeredBetween(snapshot, read))

    companion object {
        fun firstOf(read: TownSnapshot): ShownTown = ShownTown(read, TownRegistered.nothing)
    }
}
