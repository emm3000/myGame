package com.emm.mygame.core.network.account

import com.emm.mygame.core.model.account.PlayerScaffold
import com.emm.mygame.core.model.account.SessionRepository
import com.emm.mygame.core.model.account.SignUpRefusal
import com.emm.mygame.core.model.account.SignUpResult
import com.emm.mygame.core.model.account.SignedInPlayer
import com.emm.mygame.core.network.FakeTokenCipher
import com.emm.mygame.core.network.platform.TokenStore
import com.emm.mygame.core.network.takeRequestWithin
import java.security.ProviderException
import kotlinx.coroutines.test.runTest
import mockwebserver3.MockResponse
import mockwebserver3.RecordedRequest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class SignUpRepositoryTest : SessionRepositoryFixture() {

    @Test
    fun `stores the token of the account it creates as a bearer for the next request`() = runTest {
        val sessions: SessionRepository = repository(tokenStore())
        api.enqueue(createdSession(token = "fresh-session", email = "elena@encinar.es"))
        api.enqueue(player(email = "elena@encinar.es"))

        val result: SignUpResult = sessions.signUp("elena@encinar.es", "hierro-y-lana", PlayerScaffold.Spanish)
        sessions.restore()

        assertEquals(
            SignUpResult.SignedIn(
                SignedInPlayer(email = "elena@encinar.es", isEmailVerified = true, scaffold = PlayerScaffold.Spanish),
            ),
            result,
        )
        val signUpRequest: RecordedRequest = api.takeRequestWithin()
        assertEquals("/api/auth/sign-up/native", signUpRequest.url.encodedPath)
        assertEquals(
            """{"email":"elena@encinar.es","password":"hierro-y-lana","scaffold":"es"}""",
            signUpRequest.body?.utf8(),
        )
        assertEquals("Bearer fresh-session", api.takeRequestWithin().headers["Authorization"])
    }

    @Test
    fun `sends the scaffold the player picked with the new account`() = runTest {
        val sessions: SessionRepository = repository(tokenStore())
        api.enqueue(createdSession(token = "spanish-session", email = "elena@encinar.es"))
        api.enqueue(createdSession(token = "english-session", email = "ines@sotoverde.es"))

        sessions.signUp("elena@encinar.es", "hierro-y-lana", PlayerScaffold.Spanish)
        sessions.signUp("ines@sotoverde.es", "pinar-de-roble", PlayerScaffold.None)

        assertEquals(
            """{"email":"elena@encinar.es","password":"hierro-y-lana","scaffold":"es"}""",
            api.takeRequestWithin().body?.utf8(),
        )
        assertEquals(
            """{"email":"ines@sotoverde.es","password":"pinar-de-roble","scaffold":"none"}""",
            api.takeRequestWithin().body?.utf8(),
        )
    }

    @Test
    fun `signs up without a bearer while a token is still stored`() = runTest {
        val store: TokenStore = tokenStore().apply { write("stale-session") }
        api.enqueue(createdSession(token = "fresh-session", email = "elena@encinar.es"))

        repository(store).signUp("elena@encinar.es", "hierro-y-lana", PlayerScaffold.Spanish)

        assertNull(api.takeRequestWithin().headers["Authorization"])
    }

    @Test
    fun `answers the sign-up refusal the api names`() = runTest {
        val sessions: SessionRepository = repository(tokenStore())
        api.enqueue(json(400, refusalJson("WeakPassword")))
        api.enqueue(json(409, refusalJson("EmailTaken")))
        api.enqueue(json(400, refusalJson("MalformedEmail")))

        val answers: List<SignUpResult> =
            List(3) { sessions.signUp("elena@encinar.es", "corta", PlayerScaffold.Spanish) }

        assertEquals(
            listOf(
                SignUpResult.Refused(SignUpRefusal.WeakPassword),
                SignUpResult.Refused(SignUpRefusal.EmailTaken),
                SignUpResult.Refused(SignUpRefusal.MalformedEmail),
            ),
            answers,
        )
    }

    @Test
    fun `answers an unrecognized sign-up refusal for a malformed request the api answers without a kind`() =
        runTest {
            api.enqueue(MockResponse.Builder().code(400).build())

            val result: SignUpResult = repository(tokenStore()).signUp("elena", "hierro-y-lana", PlayerScaffold.Spanish)

            assertEquals(SignUpResult.Refused(SignUpRefusal.Unrecognized), result)
        }

    @Test
    fun `answers an unrecognized sign-up refusal for a kind the spec does not list`() = runTest {
        api.enqueue(json(400, refusalJson("NameTooLong")))

        val result: SignUpResult =
            repository(tokenStore()).signUp("elena@encinar.es", "hierro-y-lana", PlayerScaffold.Spanish)

        assertEquals(SignUpResult.Refused(SignUpRefusal.Unrecognized), result)
    }

    @Test
    fun `answers unreachable when the sign-up cannot reach the api`() = runTest {
        val sessions: SessionRepository = repository(tokenStore())
        api.close()

        val result: SignUpResult = sessions.signUp("elena@encinar.es", "hierro-y-lana", PlayerScaffold.Spanish)

        assertEquals(SignUpResult.Unreachable, result)
    }

    @Test
    fun `answers unreachable when the api fails while creating the account`() = runTest {
        api.enqueue(MockResponse.Builder().code(503).build())

        val result: SignUpResult =
            repository(tokenStore()).signUp("elena@encinar.es", "hierro-y-lana", PlayerScaffold.Spanish)

        assertEquals(SignUpResult.Unreachable, result)
    }

    @Test
    fun `answers unreachable when the keystore cannot seal the created account's token`() = runTest {
        val sealFailure: ProviderException = ProviderException("The keystore could not encrypt")
        val store: TokenStore = tokenStore(FakeTokenCipher(encryptFailure = sealFailure))
        api.enqueue(createdSession(token = "fresh-session", email = "elena@encinar.es"))

        val result: SignUpResult = repository(store).signUp("elena@encinar.es", "hierro-y-lana", PlayerScaffold.Spanish)

        assertEquals(SignUpResult.Unreachable, result)
        assertNull(store.read())
    }

    private fun createdSession(token: String, email: String): MockResponse =
        json(201, """{"token":"$token","player":${playerJson(email, isEmailVerified = true)}}""")
}
