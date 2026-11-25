package com.emm.mygame.feature.learning.reviews

import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.guidance.numberOf

internal fun TownSnapshot.shownNumberOf(lesson: LessonId): Int? = numberOf(lesson).takeIf { number: Int -> number > 0 }
