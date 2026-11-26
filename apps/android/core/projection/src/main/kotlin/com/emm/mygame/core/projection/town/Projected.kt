package com.emm.mygame.core.projection.town

import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.projection.ResourceStock

fun TownSnapshot.Stock.projected(): ResourceStock = ResourceStock(amount, ratePerHour, capacity)
