package com.emm.mygame

import androidx.navigation3.runtime.NavKey
import kotlinx.serialization.Serializable

@Serializable
sealed interface Destination : NavKey {

    @Serializable
    data class SignIn(val isSessionEnded: Boolean) : Destination

    @Serializable
    data object SignUp : Destination

    @Serializable
    data object Fief : Destination

    @Serializable
    data object Map : Destination

    @Serializable
    data object Chronicle : Destination
}
