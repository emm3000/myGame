package com.emm.mygame.core.model.learning

interface KeepGoingRepository {

    suspend fun readFrames(): KeepGoingResult
}
