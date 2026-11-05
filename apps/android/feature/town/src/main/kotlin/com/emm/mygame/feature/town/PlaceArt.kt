package com.emm.mygame.feature.town

import com.emm.mygame.core.designsystem.R as DesignSystemR
import com.emm.mygame.core.network.TownBuildingKind

internal fun placeArtOf(kind: TownBuildingKind, level: Int): Int? {
    if (level <= 0) return null
    val tier: Int = (level + 1) / 2
    return artTiersOf(kind)[tier - 1]
}

private fun artTiersOf(kind: TownBuildingKind): List<Int> = when (kind) {
    TownBuildingKind.Homes -> listOf(
        DesignSystemR.drawable.designsystem_place_homes_1,
        DesignSystemR.drawable.designsystem_place_homes_2,
        DesignSystemR.drawable.designsystem_place_homes_3,
        DesignSystemR.drawable.designsystem_place_homes_4,
        DesignSystemR.drawable.designsystem_place_homes_5,
    )
    TownBuildingKind.Farm -> listOf(
        DesignSystemR.drawable.designsystem_place_farm_1,
        DesignSystemR.drawable.designsystem_place_farm_2,
        DesignSystemR.drawable.designsystem_place_farm_3,
        DesignSystemR.drawable.designsystem_place_farm_4,
        DesignSystemR.drawable.designsystem_place_farm_5,
    )
    TownBuildingKind.Factory -> listOf(
        DesignSystemR.drawable.designsystem_place_factory_1,
        DesignSystemR.drawable.designsystem_place_factory_2,
        DesignSystemR.drawable.designsystem_place_factory_3,
        DesignSystemR.drawable.designsystem_place_factory_4,
        DesignSystemR.drawable.designsystem_place_factory_5,
    )
    TownBuildingKind.PowerStation -> listOf(
        DesignSystemR.drawable.designsystem_place_power_station_1,
        DesignSystemR.drawable.designsystem_place_power_station_2,
        DesignSystemR.drawable.designsystem_place_power_station_3,
        DesignSystemR.drawable.designsystem_place_power_station_4,
        DesignSystemR.drawable.designsystem_place_power_station_5,
    )
    TownBuildingKind.Storage -> listOf(
        DesignSystemR.drawable.designsystem_place_storage_1,
        DesignSystemR.drawable.designsystem_place_storage_2,
        DesignSystemR.drawable.designsystem_place_storage_3,
        DesignSystemR.drawable.designsystem_place_storage_4,
        DesignSystemR.drawable.designsystem_place_storage_5,
    )
    TownBuildingKind.School -> listOf(
        DesignSystemR.drawable.designsystem_place_school_1,
        DesignSystemR.drawable.designsystem_place_school_2,
        DesignSystemR.drawable.designsystem_place_school_3,
        DesignSystemR.drawable.designsystem_place_school_4,
        DesignSystemR.drawable.designsystem_place_school_5,
    )
    TownBuildingKind.Office -> listOf(
        DesignSystemR.drawable.designsystem_place_office_1,
        DesignSystemR.drawable.designsystem_place_office_2,
        DesignSystemR.drawable.designsystem_place_office_3,
        DesignSystemR.drawable.designsystem_place_office_4,
        DesignSystemR.drawable.designsystem_place_office_5,
    )
}
