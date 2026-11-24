package com.emm.mygame.feature.account

sealed interface SignInEffect {

    data object SignedIn : SignInEffect
}
