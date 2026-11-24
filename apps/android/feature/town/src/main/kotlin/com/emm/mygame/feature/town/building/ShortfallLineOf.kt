package com.emm.mygame.feature.town.building

import com.emm.mygame.core.ui.CopyReader
import com.emm.mygame.feature.town.R
import com.emm.mygame.feature.town.TownUiState

internal fun CopyReader.shortfallLineOf(block: TownUiState.BlockReason.Resources): String {
    val amounts: List<String> = block.shortfalls.map { shortfall: TownUiState.Shortfall ->
        amountLineOf(shortfall.kind, shortfall.amount)
    }
    return text(R.string.town_shortfall, "missing" to listPhraseOf(amounts))
}
