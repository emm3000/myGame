package com.emm.mygame.feature.town

import com.emm.mygame.core.designsystem.MyGameArt
import com.emm.mygame.core.designsystem.MyGameArtTint
import com.emm.mygame.core.designsystem.R as DesignSystemR
import com.emm.mygame.core.network.TownBuildingKind

internal fun placeArtOf(kind: TownBuildingKind, level: Int): MyGameArt = MyGameArt(
    drawable = levelsOf(kind)[level],
    tint = if (level == 0) MyGameArtTint.SurfaceSunken else MyGameArtTint.None,
)

private fun levelsOf(kind: TownBuildingKind): List<Int> = when (kind) {
    TownBuildingKind.Homes -> homesLevels
    TownBuildingKind.Farm -> farmLevels
    TownBuildingKind.School -> schoolLevels
    TownBuildingKind.Office -> officeLevels
    TownBuildingKind.Factory -> factoryLevels
    TownBuildingKind.PowerStation -> powerStationLevels
    TownBuildingKind.Storage -> storageLevels
}

private val homesLevels: List<Int> = listOf(
    DesignSystemR.drawable.designsystem_place_homes_0,
    DesignSystemR.drawable.designsystem_place_homes_1,
    DesignSystemR.drawable.designsystem_place_homes_2,
    DesignSystemR.drawable.designsystem_place_homes_3,
    DesignSystemR.drawable.designsystem_place_homes_4,
    DesignSystemR.drawable.designsystem_place_homes_5,
    DesignSystemR.drawable.designsystem_place_homes_6,
    DesignSystemR.drawable.designsystem_place_homes_7,
    DesignSystemR.drawable.designsystem_place_homes_8,
    DesignSystemR.drawable.designsystem_place_homes_9,
    DesignSystemR.drawable.designsystem_place_homes_10,
)

private val farmLevels: List<Int> = listOf(
    DesignSystemR.drawable.designsystem_place_farm_0,
    DesignSystemR.drawable.designsystem_place_farm_1,
    DesignSystemR.drawable.designsystem_place_farm_2,
    DesignSystemR.drawable.designsystem_place_farm_3,
    DesignSystemR.drawable.designsystem_place_farm_4,
    DesignSystemR.drawable.designsystem_place_farm_5,
    DesignSystemR.drawable.designsystem_place_farm_6,
    DesignSystemR.drawable.designsystem_place_farm_7,
    DesignSystemR.drawable.designsystem_place_farm_8,
    DesignSystemR.drawable.designsystem_place_farm_9,
    DesignSystemR.drawable.designsystem_place_farm_10,
)

private val schoolLevels: List<Int> = listOf(
    DesignSystemR.drawable.designsystem_place_school_0,
    DesignSystemR.drawable.designsystem_place_school_1,
    DesignSystemR.drawable.designsystem_place_school_2,
    DesignSystemR.drawable.designsystem_place_school_3,
    DesignSystemR.drawable.designsystem_place_school_4,
    DesignSystemR.drawable.designsystem_place_school_5,
    DesignSystemR.drawable.designsystem_place_school_6,
    DesignSystemR.drawable.designsystem_place_school_7,
    DesignSystemR.drawable.designsystem_place_school_8,
    DesignSystemR.drawable.designsystem_place_school_9,
    DesignSystemR.drawable.designsystem_place_school_10,
)

private val officeLevels: List<Int> = listOf(
    DesignSystemR.drawable.designsystem_place_office_0,
    DesignSystemR.drawable.designsystem_place_office_1,
    DesignSystemR.drawable.designsystem_place_office_2,
    DesignSystemR.drawable.designsystem_place_office_3,
    DesignSystemR.drawable.designsystem_place_office_4,
    DesignSystemR.drawable.designsystem_place_office_5,
    DesignSystemR.drawable.designsystem_place_office_6,
    DesignSystemR.drawable.designsystem_place_office_7,
    DesignSystemR.drawable.designsystem_place_office_8,
    DesignSystemR.drawable.designsystem_place_office_9,
    DesignSystemR.drawable.designsystem_place_office_10,
)

private val factoryLevels: List<Int> = listOf(
    DesignSystemR.drawable.designsystem_place_factory_0,
    DesignSystemR.drawable.designsystem_place_factory_1,
    DesignSystemR.drawable.designsystem_place_factory_2,
    DesignSystemR.drawable.designsystem_place_factory_3,
    DesignSystemR.drawable.designsystem_place_factory_4,
    DesignSystemR.drawable.designsystem_place_factory_5,
    DesignSystemR.drawable.designsystem_place_factory_6,
    DesignSystemR.drawable.designsystem_place_factory_7,
    DesignSystemR.drawable.designsystem_place_factory_8,
    DesignSystemR.drawable.designsystem_place_factory_9,
    DesignSystemR.drawable.designsystem_place_factory_10,
)

private val powerStationLevels: List<Int> = listOf(
    DesignSystemR.drawable.designsystem_place_power_station_0,
    DesignSystemR.drawable.designsystem_place_power_station_1,
    DesignSystemR.drawable.designsystem_place_power_station_2,
    DesignSystemR.drawable.designsystem_place_power_station_3,
    DesignSystemR.drawable.designsystem_place_power_station_4,
    DesignSystemR.drawable.designsystem_place_power_station_5,
    DesignSystemR.drawable.designsystem_place_power_station_6,
    DesignSystemR.drawable.designsystem_place_power_station_7,
    DesignSystemR.drawable.designsystem_place_power_station_8,
    DesignSystemR.drawable.designsystem_place_power_station_9,
    DesignSystemR.drawable.designsystem_place_power_station_10,
)

private val storageLevels: List<Int> = listOf(
    DesignSystemR.drawable.designsystem_place_storage_0,
    DesignSystemR.drawable.designsystem_place_storage_1,
    DesignSystemR.drawable.designsystem_place_storage_2,
    DesignSystemR.drawable.designsystem_place_storage_3,
    DesignSystemR.drawable.designsystem_place_storage_4,
    DesignSystemR.drawable.designsystem_place_storage_5,
    DesignSystemR.drawable.designsystem_place_storage_6,
    DesignSystemR.drawable.designsystem_place_storage_7,
    DesignSystemR.drawable.designsystem_place_storage_8,
    DesignSystemR.drawable.designsystem_place_storage_9,
    DesignSystemR.drawable.designsystem_place_storage_10,
)
