package com.emm.mygame.core.network.town.building

import com.emm.mygame.core.model.town.building.NeededWordKind
import com.emm.mygame.core.network.generated.models.NeededWordKind as WireNeededWordKind

internal fun WireNeededWordKind.toNeededWordKind(): NeededWordKind? = when (this) {
    WireNeededWordKind.stable -> NeededWordKind.Stable
    WireNeededWordKind.retained -> NeededWordKind.Retained
    WireNeededWordKind.unknown_default_open_api -> null
}
