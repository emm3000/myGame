package com.emm.mygame.core.network

sealed interface TownHiringRefusal {

    data class OfficeTooLow(val officeLevel: Int, val requiredOfficeLevel: Int) : TownHiringRefusal

    data object HiringSlotBusy : TownHiringRefusal

    data class NotEnoughPeople(val required: Int, val free: Int) : TownHiringRefusal

    data object NotEnoughResources : TownHiringRefusal

    data object HiringOrderNotFound : TownHiringRefusal

    data object TownNotFound : TownHiringRefusal

    data object Unrecognized : TownHiringRefusal
}
