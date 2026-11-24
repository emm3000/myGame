package com.emm.mygame.feature.holdout

import com.emm.mygame.core.model.learning.WordId
import com.emm.mygame.core.model.placement.ChoiceId
import com.emm.mygame.core.model.placement.PlacementChoice
import com.emm.mygame.core.model.placement.PlacementItem

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
