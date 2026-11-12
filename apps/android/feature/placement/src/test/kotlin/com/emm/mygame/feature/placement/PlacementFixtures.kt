package com.emm.mygame.feature.placement

import com.emm.mygame.core.network.ChoiceId
import com.emm.mygame.core.network.Placement
import com.emm.mygame.core.network.PlacementBand
import com.emm.mygame.core.network.PlacementChoice
import com.emm.mygame.core.network.PlacementItem
import com.emm.mygame.core.network.PlacementScore
import com.emm.mygame.core.network.WordId

internal val houseMeaning: ChoiceId = ChoiceId("choice-house")

internal val dogMeaning: ChoiceId = ChoiceId("choice-dog")

internal val walkMeaning: ChoiceId = ChoiceId("choice-walk")

internal val runMeaning: ChoiceId = ChoiceId("choice-run")

internal val house: PlacementItem = PlacementItem(
    word = WordId("word-house"),
    text = "house",
    choices = listOf(PlacementChoice(houseMeaning, "casa"), PlacementChoice(dogMeaning, "perro")),
)

internal val walk: PlacementItem = PlacementItem(
    word = WordId("word-walk"),
    text = "walk",
    choices = listOf(PlacementChoice(runMeaning, "correr"), PlacementChoice(walkMeaning, "caminar")),
)

internal val firstBandPassed: PlacementScore = PlacementScore(PlacementBand.First, score = 30, isPlacedOut = true)

internal val secondBandFailed: PlacementScore = PlacementScore(PlacementBand.Second, score = 12, isPlacedOut = false)

internal val firstBandAsked: Placement.Asking =
    Placement.Asking(band = PlacementBand.First, items = listOf(house, walk), scores = emptyList())

internal val secondBandAsked: Placement.Asking =
    Placement.Asking(band = PlacementBand.Second, items = listOf(walk), scores = listOf(firstBandPassed))

internal val placedAtSecondBand: Placement.Closed = Placement.Closed(listOf(firstBandPassed, secondBandFailed))

internal val skipped: Placement.Closed = Placement.Closed(emptyList())
