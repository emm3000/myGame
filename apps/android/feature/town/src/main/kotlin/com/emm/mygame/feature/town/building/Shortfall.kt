package com.emm.mygame.feature.town.building

import com.emm.mygame.core.model.town.TownResourceKind

data class Shortfall(val kind: TownResourceKind, val amount: Long)
