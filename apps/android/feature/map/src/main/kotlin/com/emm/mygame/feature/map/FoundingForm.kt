package com.emm.mygame.feature.map

import com.emm.mygame.core.network.FiefSnapshot
import com.emm.mygame.core.network.UnitCount
import com.emm.mygame.core.network.UnitKind

internal fun FiefSnapshot.foundingFormOf(choice: MarchChoice): MapUiState.FoundingForm {
    val settlersAtHome: Int = settlersAtHome()
    val isNameBlank: Boolean = choice.nameEntry.isBlank()
    return MapUiState.FoundingForm(
        target = choice.target,
        settlersAtHome = settlersAtHome,
        nameEntry = choice.nameEntry,
        isFieldLocked = march != null,
        preview = if (isNameBlank) null else MapUiState.FoundingPreview(road = oneWayTo(choice.target, foundingParty)),
        block = when {
            march != null -> MapUiState.MarchBlock.MarchAway
            isNameBlank -> MapUiState.MarchBlock.BlankName
            settlersAtHome < FOUNDING_SETTLERS ->
                MapUiState.MarchBlock.NotEnoughAtHome(UnitKind.Settler, FOUNDING_SETTLERS, settlersAtHome)
            else -> null
        },
        send = choice.send,
    )
}

internal fun foundingNameOf(choice: MarchChoice): String = choice.nameEntry.trim()

private val foundingParty: List<UnitCount> = listOf(UnitCount(UnitKind.Settler, FOUNDING_SETTLERS))

private const val FOUNDING_SETTLERS: Int = 1
