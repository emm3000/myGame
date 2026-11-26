package com.emm.mygame.feature.today

import com.emm.mygame.core.model.town.TownSnapshot

internal data class TodayVisit(val isShown: Boolean = false, val away: TownSnapshot.Away? = null)
