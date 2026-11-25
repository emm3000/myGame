package com.emm.mygame.core.model.town

import kotlinx.coroutines.flow.StateFlow

interface TownReader {

    val town: StateFlow<HeldTown?>

    suspend fun read(): TownReadResult
}
