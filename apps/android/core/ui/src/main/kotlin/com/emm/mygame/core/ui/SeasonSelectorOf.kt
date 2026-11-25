package com.emm.mygame.core.ui

import com.emm.mygame.core.model.town.SeasonKind

fun seasonSelectorOf(kind: SeasonKind): String = when (kind) {
    SeasonKind.Spring -> "spring"
    SeasonKind.Summer -> "summer"
    SeasonKind.Fall -> "fall"
    SeasonKind.Winter -> "winter"
}
