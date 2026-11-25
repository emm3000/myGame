package com.emm.mygame.core.model.town

interface TownFoundingRepository {

    suspend fun found(name: String): TownFoundResult
}
