package com.emm.mygame.core.model.placement

import com.emm.mygame.core.model.learning.WordId

data class PlacementItem(val word: WordId, val text: String, val choices: List<PlacementChoice>)
