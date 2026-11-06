package com.emm.mygame.feature.school

import com.emm.mygame.core.designsystem.MyGameArt
import com.emm.mygame.core.designsystem.MyGameArtTint
import com.emm.mygame.core.designsystem.R as DesignSystemR

private val silhouettesByWord: Map<String, Int> = mapOf(
    "home" to DesignSystemR.drawable.designsystem_place_homes_0,
    "farm" to DesignSystemR.drawable.designsystem_place_farm_0,
    "factory" to DesignSystemR.drawable.designsystem_place_factory_0,
    "station" to DesignSystemR.drawable.designsystem_place_power_station_0,
    "storage" to DesignSystemR.drawable.designsystem_place_storage_0,
    "school" to DesignSystemR.drawable.designsystem_place_school_0,
    "office" to DesignSystemR.drawable.designsystem_place_office_0,
)

internal fun wordArtOf(word: String): MyGameArt? =
    silhouettesByWord[word]?.let { drawable: Int -> MyGameArt(drawable, MyGameArtTint.OnBlock) }
