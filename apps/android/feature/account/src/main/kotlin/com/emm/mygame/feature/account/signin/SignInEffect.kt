package com.emm.mygame.feature.account.signin

sealed interface SignInEffect {

    data object SignedIn : SignInEffect
}
