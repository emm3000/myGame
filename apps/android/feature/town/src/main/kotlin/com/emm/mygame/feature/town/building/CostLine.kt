package com.emm.mygame.feature.town.building

import com.emm.mygame.core.model.town.TownResourceKind

data class CostLine(val kind: TownResourceKind, val amount: Long, val isShort: Boolean)
