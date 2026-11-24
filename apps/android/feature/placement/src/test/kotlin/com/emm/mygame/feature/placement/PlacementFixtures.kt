package com.emm.mygame.feature.placement

import com.emm.mygame.core.model.learning.WordId
import com.emm.mygame.core.model.placement.ChoiceId
import com.emm.mygame.core.model.placement.Placement
import com.emm.mygame.core.model.placement.PlacementBand
import com.emm.mygame.core.model.placement.PlacementChoice
import com.emm.mygame.core.model.placement.PlacementItem
import com.emm.mygame.core.model.placement.PlacementScore

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
