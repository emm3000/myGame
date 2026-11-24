package com.emm.mygame.feature.town

import com.emm.mygame.core.model.town.building.NeededWordKind

internal fun neededWordSelectorOf(kind: NeededWordKind): String = when (kind) {
    NeededWordKind.Stable -> "stable"
    NeededWordKind.Retained -> "retained"
}
