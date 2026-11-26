package com.emm.mygame.core.projection.town

import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSnapshot
import kotlin.time.Instant

fun TownSnapshot.drawnAt(now: Instant): Map<TownResourceKind, Long> =
    stocks.associate { stock: TownSnapshot.Stock ->
        stock.kind to stock.projected().amountAt(readAt = readAt, now = now)
    }
