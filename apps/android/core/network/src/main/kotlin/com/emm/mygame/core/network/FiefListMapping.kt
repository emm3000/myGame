package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.models.FiefListFiefsInner

internal fun FiefListFiefsInner.toListedFief(): ListedFief = ListedFief(
    id = FiefId(id.toString()),
    name = name,
    address = FiefAddress(kingdom = coordinates.kingdom, province = coordinates.province, plot = coordinates.plot),
    freeSlots = freeSlots.mapNotNull { slot: FiefListFiefsInner.FreeSlots -> slot.toFreeSlot() },
    fullStores = fullStores.mapNotNull { store: FiefListFiefsInner.FullStores -> store.toResourceKind() },
)

private fun FiefListFiefsInner.FreeSlots.toFreeSlot(): FreeSlot? = when (this) {
    FiefListFiefsInner.FreeSlots.build -> FreeSlot.Build
    FiefListFiefsInner.FreeSlots.study -> FreeSlot.Study
    FiefListFiefsInner.FreeSlots.recruit -> FreeSlot.Recruit
    FiefListFiefsInner.FreeSlots.march -> FreeSlot.March
    FiefListFiefsInner.FreeSlots.unknown_default_open_api -> null
}

private fun FiefListFiefsInner.FullStores.toResourceKind(): ResourceKind? = when (this) {
    FiefListFiefsInner.FullStores.wood -> ResourceKind.Wood
    FiefListFiefsInner.FullStores.stone -> ResourceKind.Stone
    FiefListFiefsInner.FullStores.iron -> ResourceKind.Iron
    FiefListFiefsInner.FullStores.gold -> ResourceKind.Gold
    FiefListFiefsInner.FullStores.food -> ResourceKind.Food
    FiefListFiefsInner.FullStores.unknown_default_open_api -> null
}
