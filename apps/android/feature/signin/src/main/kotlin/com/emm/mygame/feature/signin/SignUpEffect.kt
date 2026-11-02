package com.emm.mygame.feature.signin

sealed interface SignUpEffect {

    data object SignedIn : SignUpEffect
}
