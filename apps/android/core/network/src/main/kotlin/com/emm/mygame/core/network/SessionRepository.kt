package com.emm.mygame.core.network

interface SessionRepository {

    suspend fun signIn(email: String, password: String): SignInResult

    suspend fun signUp(email: String, password: String, scaffold: PlayerScaffold): SignUpResult

    suspend fun requestPasswordReset(email: String): PasswordResetRequestResult

    suspend fun resetPassword(token: PasswordResetToken, password: String): PasswordResetResult

    suspend fun verifyEmail(token: EmailVerificationToken): EmailVerificationResult

    suspend fun restore(): RestoreResult

    suspend fun resendVerification(): VerificationResendResult

    suspend fun changeScaffold(scaffold: PlayerScaffold): ScaffoldChangeResult

    suspend fun signOut()
}
