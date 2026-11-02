package com.emm.mygame.core.network

sealed interface RestoreResult {

    data class SignedIn(val player: SignedInPlayer) : RestoreResult

    data object SignedOut : RestoreResult

    data object Unreachable : RestoreResult
}
