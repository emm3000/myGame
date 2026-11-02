package com.emm.mygame

import androidx.navigation3.runtime.NavKey
import kotlinx.serialization.Serializable

@Serializable
sealed interface Destination : NavKey {

    @Serializable
    data object SignIn : Destination

    @Serializable
    data object SignUp : Destination

    @Serializable
    data object Fief : Destination

    @Serializable
    data object Chronicle : Destination
}
