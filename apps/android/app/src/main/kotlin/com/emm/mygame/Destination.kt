package com.emm.mygame

import androidx.navigation3.runtime.NavKey
import com.emm.mygame.core.network.HoldoutCheckWeek
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.PlacementBand
import kotlinx.serialization.Serializable

@Serializable
sealed interface Destination : NavKey {

    @Serializable
    data class SignIn(val isSessionEnded: Boolean) : Destination

    @Serializable
    data object SignUp : Destination

    @Serializable
    data object ForgotPassword : Destination

    @Serializable
    data object Town : Destination

    @Serializable
    data object School : Destination

    @Serializable
    data object Report : Destination

    @Serializable
    data object News : Destination

    @Serializable
    data object Settings : Destination

    @Serializable
    data object Map : Destination

    @Serializable
    data object Review : Destination

    @Serializable
    data object Placement : Destination

    @Serializable
    data class HoldoutCheck(val band: PlacementBand, val week: HoldoutCheckWeek) : Destination

    @Serializable
    data class LessonWords(val lesson: LessonId, val walked: List<LessonId>) : Destination
}
