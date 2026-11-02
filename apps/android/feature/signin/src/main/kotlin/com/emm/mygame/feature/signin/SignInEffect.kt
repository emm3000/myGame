package com.emm.mygame.feature.signin

sealed interface SignInEffect {

    data object SignedIn : SignInEffect
}
