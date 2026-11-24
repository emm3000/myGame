package com.emm.mygame.core.network

interface HoldoutCheckRepository {

    suspend fun read(): HoldoutChecksReadResult

    suspend fun begin(band: PlacementBand, week: HoldoutCheckWeek): HoldoutCheckChangeResult

    suspend fun skip(band: PlacementBand, week: HoldoutCheckWeek): HoldoutCheckChangeResult

    suspend fun answer(
        band: PlacementBand,
        week: HoldoutCheckWeek,
        answers: List<PlacementAnswer>,
    ): HoldoutCheckChangeResult
}
