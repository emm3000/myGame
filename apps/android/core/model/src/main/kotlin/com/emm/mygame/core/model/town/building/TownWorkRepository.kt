package com.emm.mygame.core.model.town.building

interface TownWorkRepository {

    suspend fun startWork(building: TownBuildingKind): TownWorkResult

    suspend fun stopWork(building: TownBuildingKind, level: Int): TownWorkResult
}
