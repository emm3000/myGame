package com.emm.mygame.core.network

sealed interface RecruitRefusal {

    data class BarracksTooLow(val unit: UnitKind, val requiredBarracksLevel: Int) : RecruitRefusal

    data object BarracksNotBuilt : RecruitRefusal

    data object RecruitSlotBusy : RecruitRefusal

    data object RecruitOrderNotFound : RecruitRefusal

    data object InsufficientResources : RecruitRefusal

    data object NotEnoughPeasants : RecruitRefusal

    data object Unrecognized : RecruitRefusal
}
