package com.emm.mygame.feature.map

import com.emm.mygame.core.network.UnitCount

internal data class ForageRequest(val party: List<UnitCount>, val stayHours: Int)
