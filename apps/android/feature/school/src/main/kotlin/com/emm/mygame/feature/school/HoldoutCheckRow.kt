package com.emm.mygame.feature.school

import com.emm.mygame.core.network.HoldoutCheckWeek
import com.emm.mygame.core.network.PlacementBand

data class HoldoutCheckRow(val band: PlacementBand, val week: HoldoutCheckWeek)
