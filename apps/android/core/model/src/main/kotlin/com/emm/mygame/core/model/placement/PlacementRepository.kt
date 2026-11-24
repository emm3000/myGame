package com.emm.mygame.core.model.placement

interface PlacementRepository {

    suspend fun read(): PlacementReadResult

    suspend fun begin(): PlacementChangeResult

    suspend fun skip(): PlacementChangeResult

    suspend fun answer(band: PlacementBand, answers: List<PlacementAnswer>): PlacementChangeResult
}
