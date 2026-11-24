package com.emm.mygame.feature.account.signup

sealed interface SignUpEffect {

    data object SignedIn : SignUpEffect
}
