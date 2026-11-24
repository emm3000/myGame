package com.emm.mygame.core.testing

import com.emm.mygame.core.model.learning.WordId
import com.emm.mygame.core.model.placement.ChoiceId
import com.emm.mygame.core.model.placement.PlacementChoice
import com.emm.mygame.core.model.placement.PlacementItem

val houseMeaning: ChoiceId = ChoiceId("choice-house")

val dogMeaning: ChoiceId = ChoiceId("choice-dog")

val walkMeaning: ChoiceId = ChoiceId("choice-walk")

val runMeaning: ChoiceId = ChoiceId("choice-run")

val house: PlacementItem = PlacementItem(
    word = WordId("word-house"),
    text = "house",
    choices = listOf(PlacementChoice(houseMeaning, "casa"), PlacementChoice(dogMeaning, "perro")),
)

val walk: PlacementItem = PlacementItem(
    word = WordId("word-walk"),
    text = "walk",
    choices = listOf(PlacementChoice(runMeaning, "correr"), PlacementChoice(walkMeaning, "caminar")),
)
