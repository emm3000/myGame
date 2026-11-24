package com.emm.mygame.feature.account

sealed interface SignUpEffect {

    data object SignedIn : SignUpEffect
}
