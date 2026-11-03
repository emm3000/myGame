package com.emm.mygame

import androidx.navigation3.runtime.NavKey
import com.emm.mygame.core.network.FiefId
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
    data object FirstFief : Destination

    @Serializable
    data class Fief(val fief: FiefId) : Destination

    @Serializable
    data class Map(val fief: FiefId) : Destination

    @Serializable
    data class Chronicle(val fief: FiefId) : Destination
}
