package com.emm.mygame.core.testing

import com.emm.mygame.core.network.EmailVerificationResult
import com.emm.mygame.core.network.EmailVerificationToken
import com.emm.mygame.core.network.PasswordResetRequestResult
import com.emm.mygame.core.network.PasswordResetResult
import com.emm.mygame.core.network.PasswordResetToken
import com.emm.mygame.core.network.PlayerScaffold
import com.emm.mygame.core.network.RestoreResult
import com.emm.mygame.core.network.ScaffoldChangeResult
import com.emm.mygame.core.network.SessionRepository
import com.emm.mygame.core.network.SignInResult
import com.emm.mygame.core.network.SignUpResult
import com.emm.mygame.core.network.VerificationResendResult
import kotlinx.coroutines.channels.Channel

class FakeSessionRepository : SessionRepository {

    private val restoreAnswers: Channel<RestoreResult> = Channel(Channel.UNLIMITED)

    private val signInAnswers: Channel<SignInResult> = Channel(Channel.UNLIMITED)

    private val signUpAnswers: Channel<SignUpResult> = Channel(Channel.UNLIMITED)

    private val passwordResetAnswers: Channel<PasswordResetRequestResult> = Channel(Channel.UNLIMITED)

    private val resetAnswers: Channel<PasswordResetResult> = Channel(Channel.UNLIMITED)

    private val resendAnswers: Channel<VerificationResendResult> = Channel(Channel.UNLIMITED)

    private val verifyAnswers: Channel<EmailVerificationResult> = Channel(Channel.UNLIMITED)

    private val signOutAnswers: Channel<Unit> = Channel(Channel.UNLIMITED)

    private val scaffoldChangeAnswers: Channel<ScaffoldChangeResult> = Channel(Channel.UNLIMITED)

    private val pickedScaffolds: MutableList<PlayerScaffold> = mutableListOf()

    private val attempts: MutableList<SignInAttempt> = mutableListOf()

    private val signUps: MutableList<SignUpAttempt> = mutableListOf()

    private val resetEmails: MutableList<String> = mutableListOf()

    private val resets: MutableList<PasswordReset> = mutableListOf()

    private val verifiedTokens: MutableList<EmailVerificationToken> = mutableListOf()

    var resendCount: Int = 0
        private set

    var signOutCount: Int = 0
        private set

    val signInAttempts: List<SignInAttempt>
        get() = attempts.toList()

    val signUpAttempts: List<SignUpAttempt>
        get() = signUps.toList()

    val passwordResetEmails: List<String>
        get() = resetEmails.toList()

    val passwordResets: List<PasswordReset>
        get() = resets.toList()

    val emailVerifications: List<EmailVerificationToken>
        get() = verifiedTokens.toList()

    val scaffoldChanges: List<PlayerScaffold>
        get() = pickedScaffolds.toList()

    fun answerRestore(result: RestoreResult) {
        restoreAnswers.trySend(result)
    }

    fun answerSignIn(result: SignInResult) {
        signInAnswers.trySend(result)
    }

    fun answerSignUp(result: SignUpResult) {
        signUpAnswers.trySend(result)
    }

    fun answerPasswordReset(result: PasswordResetRequestResult) {
        passwordResetAnswers.trySend(result)
    }

    fun answerPasswordChange(result: PasswordResetResult) {
        resetAnswers.trySend(result)
    }

    fun answerEmailVerification(result: EmailVerificationResult) {
        verifyAnswers.trySend(result)
    }

    fun answerResend(result: VerificationResendResult) {
        resendAnswers.trySend(result)
    }

    fun answerScaffoldChange(result: ScaffoldChangeResult) {
        scaffoldChangeAnswers.trySend(result)
    }

    fun answerSignOut() {
        signOutAnswers.trySend(Unit)
    }

    override suspend fun restore(): RestoreResult = restoreAnswers.receive()

    override suspend fun signIn(email: String, password: String): SignInResult {
        attempts += SignInAttempt(email = email, password = password)
        return signInAnswers.receive()
    }

    override suspend fun signUp(email: String, password: String, scaffold: PlayerScaffold): SignUpResult {
        signUps += SignUpAttempt(email = email, password = password, scaffold = scaffold)
        return signUpAnswers.receive()
    }

    override suspend fun requestPasswordReset(email: String): PasswordResetRequestResult {
        resetEmails += email
        return passwordResetAnswers.receive()
    }

    override suspend fun resetPassword(token: PasswordResetToken, password: String): PasswordResetResult {
        resets += PasswordReset(token = token, password = password)
        return resetAnswers.receive()
    }

    override suspend fun verifyEmail(token: EmailVerificationToken): EmailVerificationResult {
        verifiedTokens += token
        return verifyAnswers.receive()
    }

    override suspend fun resendVerification(): VerificationResendResult {
        resendCount += 1
        return resendAnswers.receive()
    }

    override suspend fun changeScaffold(scaffold: PlayerScaffold): ScaffoldChangeResult {
        pickedScaffolds += scaffold
        return scaffoldChangeAnswers.receive()
    }

    override suspend fun signOut() {
        signOutCount += 1
        signOutAnswers.receive()
    }

    data class SignInAttempt(val email: String, val password: String)

    data class PasswordReset(val token: PasswordResetToken, val password: String)

    data class SignUpAttempt(val email: String, val password: String, val scaffold: PlayerScaffold)
}
