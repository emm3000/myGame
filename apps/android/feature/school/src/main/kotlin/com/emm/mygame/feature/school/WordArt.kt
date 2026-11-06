package com.emm.mygame.feature.school

import com.emm.mygame.core.designsystem.MyGameArt
import com.emm.mygame.core.designsystem.MyGameArtTint
import com.emm.mygame.core.designsystem.R as DesignSystemR

private val silhouettesByWord: Map<String, Int> = mapOf(
    "home" to DesignSystemR.drawable.designsystem_word_homes,
    "farm" to DesignSystemR.drawable.designsystem_word_farm,
    "factory" to DesignSystemR.drawable.designsystem_word_factory,
    "station" to DesignSystemR.drawable.designsystem_word_power_station,
    "storage" to DesignSystemR.drawable.designsystem_word_storage,
    "school" to DesignSystemR.drawable.designsystem_word_school,
    "office" to DesignSystemR.drawable.designsystem_word_office,
)

internal fun wordArtOf(word: String): MyGameArt? =
    silhouettesByWord[word]?.let { drawable: Int -> MyGameArt(drawable, MyGameArtTint.OnBlock) }
