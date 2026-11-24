package com.emm.mygame.core.model.account

data class SignedInPlayer(val email: String, val isEmailVerified: Boolean, val scaffold: PlayerScaffold?)
