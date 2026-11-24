package com.emm.mygame.feature.school

import com.emm.mygame.core.model.holdout.HoldoutCheckWeek
import com.emm.mygame.core.model.placement.PlacementBand

data class HoldoutCheckRow(val band: PlacementBand, val week: HoldoutCheckWeek)
