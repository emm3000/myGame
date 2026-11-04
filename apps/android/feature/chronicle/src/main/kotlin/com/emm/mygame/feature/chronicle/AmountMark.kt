package com.emm.mygame.feature.chronicle

import android.content.res.Resources
import androidx.annotation.StringRes
import com.emm.mygame.core.designsystem.formatQuantity
import com.emm.mygame.core.network.ChronicleEvent
import com.emm.mygame.core.network.ResourceKind
import com.emm.mygame.core.network.ResourceQuantity

internal data class AmountMark(val resource: ResourceKind, val start: Int)

internal fun Resources.amountsOf(event: ChronicleEvent): String? = listedAmountsOf(event)?.sentence

internal fun Resources.amountMarksOf(event: ChronicleEvent): List<AmountMark> =
    listedAmountsOf(event)?.marks.orEmpty()

private data class ListedAmounts(val sentence: String, val marks: List<AmountMark>)

private fun Resources.listedAmountsOf(event: ChronicleEvent): ListedAmounts? = when (event) {
    is ChronicleEvent.UpgradeCancelled -> listedAmounts(event.refund, R.string.amounts_refunded)
    is ChronicleEvent.StudyCancelled -> listedAmounts(event.refund, R.string.amounts_refunded)
    is ChronicleEvent.RecruitsCancelled -> listedAmounts(event.refund, R.string.amounts_refunded)
    is ChronicleEvent.MarchReturned -> listedAmounts(event.loot, R.string.amounts_received)
    is ChronicleEvent.TransportArrived -> listedAmounts(event.cargo, R.string.amounts_received)
    is ChronicleEvent.TransportSent -> listedAmounts(event.cargo, R.string.amounts_sent)
    is ChronicleEvent.UpgradeFinished,
    is ChronicleEvent.ArtLearned,
    is ChronicleEvent.RecruitsDelivered,
    is ChronicleEvent.BattleFought,
    is ChronicleEvent.FoundingSent,
    is ChronicleEvent.FiefFounded,
    -> null
}

private fun Resources.listedAmounts(amounts: List<ResourceQuantity>, @StringRes sentence: Int): ListedAmounts? {
    val listed: List<ResourceQuantity> = amounts.filter { it.amount > 0 }
    if (listed.isEmpty()) return null
    val phrases: List<String> = listed.map { quantity: ResourceQuantity ->
        getString(quantityLabelOf(quantity.kind), formatQuantity(quantity.amount))
    }
    val text: String = getString(sentence, spanishList(phrases))
    return ListedAmounts(sentence = text, marks = marksOf(text, listed, phrases))
}

private fun marksOf(sentence: String, listed: List<ResourceQuantity>, phrases: List<String>): List<AmountMark> {
    var searchFrom: Int = 0
    return listed.zip(phrases) { quantity: ResourceQuantity, phrase: String ->
        val start: Int = sentence.indexOf(phrase, startIndex = searchFrom)
        searchFrom = start + phrase.length
        AmountMark(quantity.kind, start)
    }
}

@StringRes
private fun quantityLabelOf(resource: ResourceKind): Int = when (resource) {
    ResourceKind.Wood -> R.string.chronicle_quantity_wood
    ResourceKind.Stone -> R.string.chronicle_quantity_stone
    ResourceKind.Iron -> R.string.chronicle_quantity_iron
    ResourceKind.Gold -> R.string.chronicle_quantity_gold
    ResourceKind.Food -> R.string.chronicle_quantity_food
}
