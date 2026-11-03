package com.emm.mygame.feature.map

import com.emm.mygame.core.network.UnitKind

sealed interface MapIntent {

    data object RetryTapped : MapIntent

    data object PreviousTapped : MapIntent

    data object NextTapped : MapIntent

    data class JumpEntryChanged(val entry: String) : MapIntent

    data object JumpTapped : MapIntent

    data object OwnProvinceTapped : MapIntent

    data class ForageToggled(val plot: Int) : MapIntent

    data class PartyEntryChanged(val unit: UnitKind, val entry: String) : MapIntent

    data class HoursEntryChanged(val entry: String) : MapIntent

    data object SendTapped : MapIntent
}
