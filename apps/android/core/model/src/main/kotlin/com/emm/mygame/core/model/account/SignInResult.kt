package com.emm.mygame.core.model.account

sealed interface SignInResult {

    data class SignedIn(val player: SignedInPlayer) : SignInResult

    data class Refused(val kind: RefusalKind) : SignInResult

    data object Unreachable : SignInResult
}
