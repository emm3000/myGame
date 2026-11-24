package com.emm.mygame.feature.town.building

import com.emm.mygame.core.model.town.building.NeededWordKind

data class WordNeedLine(val needed: Int, val held: Int, val standing: NeededWordKind)
