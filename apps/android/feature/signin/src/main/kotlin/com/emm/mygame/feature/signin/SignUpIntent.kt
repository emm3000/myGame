package com.emm.mygame.feature.signin

import com.emm.mygame.core.network.PlayerScaffold

sealed interface SignUpIntent {

    data class ScaffoldPicked(val scaffold: PlayerScaffold) : SignUpIntent

    data class EmailChanged(val email: String) : SignUpIntent

    data class PasswordChanged(val password: String) : SignUpIntent

    data object SubmitTapped : SignUpIntent

    data object RetryTapped : SignUpIntent
}
