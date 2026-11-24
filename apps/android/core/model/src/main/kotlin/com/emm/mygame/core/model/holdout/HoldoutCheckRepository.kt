package com.emm.mygame.core.model.holdout

import com.emm.mygame.core.model.placement.PlacementAnswer
import com.emm.mygame.core.model.placement.PlacementBand

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
