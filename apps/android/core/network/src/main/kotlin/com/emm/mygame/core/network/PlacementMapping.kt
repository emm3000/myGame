package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.models.PlacementAnswersAnswersInner
import com.emm.mygame.core.network.generated.models.RecognitionReviewChoicesInner
import com.emm.mygame.core.network.generated.models.AskingPlacement as WireAskingPlacement
import com.emm.mygame.core.network.generated.models.Placement as WirePlacement
import com.emm.mygame.core.network.generated.models.PlacementBand as WirePlacementBand
import com.emm.mygame.core.network.generated.models.PlacementItem as WirePlacementItem
import com.emm.mygame.core.network.generated.models.PlacementScore as WirePlacementScore

internal fun WirePlacement.toPlacement(): Placement? = when (this) {
    is WirePlacement.OfferedWrapper -> Placement.Offered
    is WirePlacement.AskingWrapper -> value.toAsking()
    is WirePlacement.ClosedWrapper -> value.scores.toScores()?.let(Placement::Closed)
}

internal fun PlacementBand.toWire(): WirePlacementBand = when (this) {
    PlacementBand.First -> WirePlacementBand._1
    PlacementBand.Second -> WirePlacementBand._2
    PlacementBand.Third -> WirePlacementBand._3
}

internal fun PlacementAnswer.toWire(): PlacementAnswersAnswersInner =
    PlacementAnswersAnswersInner(wordId = word.value, choiceId = choice.value)

private fun WireAskingPlacement.toAsking(): Placement.Asking? {
    val askedBand: PlacementBand = band.toBand() ?: return null
    val askedScores: List<PlacementScore> = scores.toScores() ?: return null
    return Placement.Asking(band = askedBand, items = items.map(::itemOf), scores = askedScores)
}

private fun List<WirePlacementScore>.toScores(): List<PlacementScore>? {
    val known: List<PlacementScore> = mapNotNull(::scoreOf)
    return if (known.size == size) known else null
}

private fun scoreOf(score: WirePlacementScore): PlacementScore? {
    val band: PlacementBand = score.band.toBand() ?: return null
    return PlacementScore(band = band, score = score.score, isPlacedOut = score.isPlacedOut)
}

internal fun itemOf(item: WirePlacementItem): PlacementItem =
    PlacementItem(word = WordId(item.wordId), text = item.word, choices = item.choices.map(::choiceOf))

private fun choiceOf(choice: RecognitionReviewChoicesInner): PlacementChoice =
    PlacementChoice(id = ChoiceId(choice.choiceId), gloss = choice.gloss)

internal fun WirePlacementBand.toBand(): PlacementBand? = when (this) {
    WirePlacementBand._1 -> PlacementBand.First
    WirePlacementBand._2 -> PlacementBand.Second
    WirePlacementBand._3 -> PlacementBand.Third
    WirePlacementBand.unknown_default_open_api -> null
}
