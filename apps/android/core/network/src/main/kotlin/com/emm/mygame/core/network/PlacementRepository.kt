package com.emm.mygame.core.network

interface PlacementRepository {

    suspend fun read(): PlacementReadResult

    suspend fun begin(): PlacementChangeResult

    suspend fun skip(): PlacementChangeResult

    suspend fun answer(band: PlacementBand, answers: List<PlacementAnswer>): PlacementChangeResult
}
