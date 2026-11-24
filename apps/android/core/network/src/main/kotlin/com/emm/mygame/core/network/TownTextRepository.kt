package com.emm.mygame.core.network

interface TownTextRepository {

    suspend fun readText(text: TextId): TownTextResult
}
