package com.emm.mygame.core.projection.town.building

import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSnapshot

fun TownSnapshot.NextLevel.lineWith(drawn: Map<TownResourceKind, Long>): NextLevelLine =
    NextLevelLine(
        level = level,
        costs = costs.map { cost: TownSnapshot.Cost ->
            CostLine(cost.kind, cost.amount, isShort = cost.amount > drawn.getValue(cost.kind))
        },
        duration = duration,
        people = people,
        wordsNeeded = wordsNeeded?.let { need: TownSnapshot.WordsNeeded ->
            WordNeedLine(needed = need.count, held = need.held, standing = need.standing)
        },
    )
