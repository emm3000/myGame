package com.emm.mygame.feature.town

import com.emm.mygame.core.network.LessonId

sealed interface TownStatusScreen {

    data object Outside : TownStatusScreen

    data object ReadsTown : TownStatusScreen

    data object ReadsNoTown : TownStatusScreen

    data object Reviews : TownStatusScreen

    data class LessonWords(val lesson: LessonId) : TownStatusScreen
}
