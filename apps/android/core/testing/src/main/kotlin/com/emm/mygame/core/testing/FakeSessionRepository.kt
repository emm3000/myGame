package com.emm.mygame.core.testing

import com.emm.mygame.core.network.RestoreResult
import com.emm.mygame.core.network.SessionRepository
import com.emm.mygame.core.network.SignInResult
import com.emm.mygame.core.network.SignUpResult
import kotlinx.coroutines.channels.Channel

class FakeSessionRepository : SessionRepository {

    private val restoreAnswers: Channel<RestoreResult> = Channel(Channel.UNLIMITED)

    private val signInAnswers: Channel<SignInResult> = Channel(Channel.UNLIMITED)

    private val signUpAnswers: Channel<SignUpResult> = Channel(Channel.UNLIMITED)

    private val signOutAnswers: Channel<Unit> = Channel(Channel.UNLIMITED)

    private val attempts: MutableList<SignInAttempt> = mutableListOf()

    private val signUps: MutableList<SignUpAttempt> = mutableListOf()

    var signOutCount: Int = 0
        private set

    val signInAttempts: List<SignInAttempt>
        get() = attempts.toList()

    val signUpAttempts: List<SignUpAttempt>
        get() = signUps.toList()

    fun answerRestore(result: RestoreResult) {
        restoreAnswers.trySend(result)
    }

    fun answerSignIn(result: SignInResult) {
        signInAnswers.trySend(result)
    }

    fun answerSignUp(result: SignUpResult) {
        signUpAnswers.trySend(result)
    }

    fun answerSignOut() {
        signOutAnswers.trySend(Unit)
    }

    override suspend fun restore(): RestoreResult = restoreAnswers.receive()

    override suspend fun signIn(email: String, password: String): SignInResult {
        attempts += SignInAttempt(email = email, password = password)
        return signInAnswers.receive()
    }

    override suspend fun signUp(email: String, password: String, fiefName: String): SignUpResult {
        signUps += SignUpAttempt(email = email, password = password, fiefName = fiefName)
        return signUpAnswers.receive()
    }

    override suspend fun signOut() {
        signOutCount += 1
        signOutAnswers.receive()
    }

    data class SignInAttempt(val email: String, val password: String)

    data class SignUpAttempt(val email: String, val password: String, val fiefName: String)
}
