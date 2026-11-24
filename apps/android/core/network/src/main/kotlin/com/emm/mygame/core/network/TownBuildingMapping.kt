package com.emm.mygame.core.network

import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.network.generated.models.TownOverview
import com.emm.mygame.core.network.generated.models.TownOverviewBuildingsHomes
import com.emm.mygame.core.network.generated.models.TownOverviewBuildingsHomesNextLevel
import com.emm.mygame.core.network.generated.models.TownOverviewBuildingsHomesNextLevelWordsNeeded
import kotlin.time.Duration.Companion.seconds

internal fun TownOverview.toBuildings(): List<TownSnapshot.Building>? {
    val words: TownWords = TownWords(stable = stableWordCount, retained = retainedWordCount)
    return listOf(
        TownBuildingKind.Homes to buildings.homes,
        TownBuildingKind.Farm to buildings.farm,
        TownBuildingKind.Factory to buildings.factory,
        TownBuildingKind.PowerStation to buildings.powerStation,
        TownBuildingKind.Storage to buildings.storage,
        TownBuildingKind.School to buildings.school,
        TownBuildingKind.Office to buildings.office,
    ).map { (kind: TownBuildingKind, place: TownOverviewBuildingsHomes) ->
        place.toBuilding(kind, words) ?: return null
    }
}

private class TownWords(val stable: Int, val retained: Int)

private fun TownOverviewBuildingsHomes.toBuilding(kind: TownBuildingKind, words: TownWords): TownSnapshot.Building? {
    val next: TownSnapshot.NextLevel? = nextLevel?.let { offered: TownOverviewBuildingsHomesNextLevel ->
        offered.toNextLevel(words) ?: return null
    }
    return TownSnapshot.Building(kind = kind, level = level, next = next)
}

private fun TownOverviewBuildingsHomesNextLevel.toNextLevel(words: TownWords): TownSnapshot.NextLevel? {
    val need: TownSnapshot.WordsNeeded? = wordsNeeded?.let { wire: TownOverviewBuildingsHomesNextLevelWordsNeeded ->
        wire.toWordsNeeded(words) ?: return null
    }
    return TownSnapshot.NextLevel(
        level = level,
        costs = cost.toCosts(),
        duration = durationSeconds.seconds,
        people = people,
        wordsNeeded = need,
    )
}

private fun TownOverviewBuildingsHomesNextLevelWordsNeeded.toWordsNeeded(
    words: TownWords,
): TownSnapshot.WordsNeeded? {
    val kind: NeededWordKind = standing.toNeededWordKind() ?: return null
    val held: Int = when (kind) {
        NeededWordKind.Stable -> words.stable
        NeededWordKind.Retained -> words.retained
    }
    return TownSnapshot.WordsNeeded(count = count, standing = kind, held = held)
}
