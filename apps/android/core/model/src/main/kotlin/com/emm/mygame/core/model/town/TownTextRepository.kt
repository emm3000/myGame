package com.emm.mygame.core.model.town

import com.emm.mygame.core.model.learning.TextId

interface TownTextRepository {

    suspend fun readText(text: TextId): TownTextResult
}
