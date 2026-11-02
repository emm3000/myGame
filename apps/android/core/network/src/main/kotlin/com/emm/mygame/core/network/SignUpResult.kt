package com.emm.mygame.core.network

sealed interface SignUpResult {

    data class SignedIn(val player: SignedInPlayer) : SignUpResult

    data class Refused(val refusal: SignUpRefusal) : SignUpResult

    data object Unreachable : SignUpResult
}
