package com.emm.mygame.core.network

data class ListedFief(
    val id: FiefId,
    val name: String,
    val address: FiefAddress,
    val freeSlots: List<FreeSlot>,
    val fullStores: List<ResourceKind>,
)
