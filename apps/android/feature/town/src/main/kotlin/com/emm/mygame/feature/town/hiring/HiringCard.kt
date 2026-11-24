package com.emm.mygame.feature.town.hiring

import com.emm.mygame.core.model.town.hiring.TownHireKind

data class HiringCard(val kind: TownHireKind, val team: Int, val requiredOfficeLevel: Int, val form: HiringForm?)
