package com.emm.mygame.core.network

sealed interface TownJobRefusal {

    data object InvalidTeam : TownJobRefusal

    data class JobHoursOutOfRange(val hours: Int, val maxHours: Int) : TownJobRefusal

    data object JobSiteOutOfBounds : TownJobRefusal

    data object TeamAlreadyOut : TownJobRefusal

    data object JobToOwnSite : TownJobRefusal

    data object SiteHeld : TownJobRefusal

    data object NotAWasteSite : TownJobRefusal

    data object NoWasteYet : TownJobRefusal

    data class NotEnoughHiresAtHome(val hire: TownHireKind, val count: Int, val atHome: Int) : TownJobRefusal

    data object JobNotFound : TownJobRefusal

    data object JobAlreadyReturning : TownJobRefusal

    data object TownNotFound : TownJobRefusal

    data object Unrecognized : TownJobRefusal
}
