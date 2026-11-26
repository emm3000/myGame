package com.emm.mygame.feature.town.building

import com.emm.mygame.core.projection.town.ReadyTime
import com.emm.mygame.core.projection.town.building.BlockReason
import com.emm.mygame.core.projection.town.building.Shortfall
import com.emm.mygame.core.ui.CopyReader
import com.emm.mygame.feature.town.R
import com.emm.mygame.feature.town.readyTimeLabelOf
import com.emm.mygame.feature.town.readyWordsOf

internal fun CopyReader.shortfallLineOf(block: BlockReason.Resources): String {
    val amounts: List<String> = block.shortfalls.map { shortfall: Shortfall ->
        amountLineOf(shortfall.kind, shortfall.amount)
    }
    val shortfall: String = text(R.string.town_shortfall, "missing" to listPhraseOf(amounts))
    val ready: ReadyTime = block.ready ?: return shortfall
    return "$shortfall ${readyWordsOf(ready)} ${readyTimeLabelOf(ready)}"
}
