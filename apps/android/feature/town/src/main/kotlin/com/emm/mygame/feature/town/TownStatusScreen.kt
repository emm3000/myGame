package com.emm.mygame.feature.town

import com.emm.mygame.core.model.learning.LessonId

sealed interface TownStatusScreen {

    data object Outside : TownStatusScreen

    data object ReadsTown : TownStatusScreen

    data object School : TownStatusScreen

    data object ReadsNoTown : TownStatusScreen

    data object Report : TownStatusScreen

    data object Reviews : TownStatusScreen

    data class LessonWords(val lesson: LessonId) : TownStatusScreen
}
