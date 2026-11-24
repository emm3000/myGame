package com.emm.mygame.core.network

import com.emm.mygame.core.model.learning.TextId

interface TownTextRepository {

    suspend fun readText(text: TextId): TownTextResult
}
