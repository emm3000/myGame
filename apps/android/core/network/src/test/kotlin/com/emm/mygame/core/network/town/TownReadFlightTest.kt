package com.emm.mygame.core.network.town

import com.emm.mygame.core.model.account.SessionRepository
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.model.town.TownRepository
import com.emm.mygame.core.network.HeldAnswers
import com.emm.mygame.core.network.apiRepositories
import com.emm.mygame.core.network.platform.TokenStore
import com.emm.mygame.core.network.platform.slowMachineEndpoint
import com.emm.mygame.core.network.takeRequestWithin
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.Deferred
import kotlinx.coroutines.async
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runTest
import mockwebserver3.Dispatcher
import mockwebserver3.MockResponse
import mockwebserver3.RecordedRequest
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test

class TownReadFlightTest : TownRepositoryFixture() {

    private val held: HeldAnswers = HeldAnswers()

    private val store: TokenStore by lazy { signedIn() }

    @Before
    fun holdAnswers() {
        api.dispatcher = held
    }

    @Test
    fun `a read that comes while another is out sends no second request`() = runTest {
        val townAnswer: CountDownLatch = held.holding(TOWN_PATH, json(200, TOWN))
        val towns: TownRepository = town(store)

        val first: Deferred<TownReadResult> = async(start = CoroutineStart.UNDISPATCHED) { towns.read() }
        api.takeRequestWithin()
        val joined: Deferred<TownReadResult> = async(start = CoroutineStart.UNDISPATCHED) { towns.read() }
        townAnswer.countDown()
        first.await()
        joined.await()

        assertEquals(1, api.requestCount)
    }

    @Test
    fun `a read sent after now never joins the read already out`() = runTest {
        val townAnswer: CountDownLatch = held.holding(TOWN_PATH, json(200, TOWN))
        val towns: TownRepository = town(store)

        val readOut: Deferred<TownReadResult> = async(start = CoroutineStart.UNDISPATCHED) { towns.read() }
        api.takeRequestWithin()
        val sentAfter: Deferred<TownReadResult> =
            async(start = CoroutineStart.UNDISPATCHED) { towns.readSentAfterNow() }
        townAnswer.countDown()
        readOut.await()
        sentAfter.await()

        assertEquals(2, api.requestCount)
    }

    @Test
    fun `a joined read still gets its answer when the read that sent the request is cancelled`() = runTest {
        val townAnswer: CountDownLatch = held.holding(TOWN_PATH, json(200, TOWN))
        val towns: TownRepository = town(store)

        val cancelled: Deferred<TownReadResult> = async(start = CoroutineStart.UNDISPATCHED) { towns.read() }
        api.takeRequestWithin()
        val joined: Deferred<TownReadResult> = async(start = CoroutineStart.UNDISPATCHED) { towns.read() }
        cancelled.cancel()
        townAnswer.countDown()

        assertEquals("Riverton", (joined.await() as TownReadResult.Read).town.name)
    }

    @Test
    fun `a read that comes after the answer sends a new request`() = runTest {
        held.answering(TOWN_PATH, json(200, TOWN))
        val towns: TownRepository = town(store)
        towns.read()

        towns.read()

        assertEquals(2, api.requestCount)
    }

    @Test
    fun `a read after a session change never hands it the town of the session before`() = runTest {
        val sessionBefore: SessionTowns = SessionTowns(beforeBearer = "Bearer opaque-session")
        api.dispatcher = sessionBefore
        val towns: TownRepository = town(store)

        val before: Deferred<TownReadResult> = async(start = CoroutineStart.UNDISPATCHED) { towns.read() }
        api.takeRequestWithin()
        store.write("another-session")
        val after: TownReadResult = towns.read()
        sessionBefore.answer.countDown()
        before.await()

        assertEquals(NEXT_TOWN_NAME, (after as TownReadResult.Read).town.name)
        assertEquals(NEXT_TOWN_NAME, towns.town.value?.town?.name)
    }

    @Test
    fun `a read after a sign-out never hands it the town of the session before`() = runTest {
        val sessionBefore: SessionTowns = SessionTowns(beforeBearer = "Bearer opaque-session")
        api.dispatcher = sessionBefore
        val towns: TownRepository = town(store)

        val before: Deferred<TownReadResult> = async(start = CoroutineStart.UNDISPATCHED) { towns.read() }
        api.takeRequestWithin()
        sessions().signOut()
        val after: TownReadResult = towns.read()
        sessionBefore.answer.countDown()
        before.await()

        assertEquals(NEXT_TOWN_NAME, (after as TownReadResult.Read).town.name)
        assertEquals(NEXT_TOWN_NAME, towns.town.value?.town?.name)
    }

    @Test
    fun `an older read that answers late never replaces the town of a newer read`() = runTest {
        val lateFirstRead: LateFirstRead = LateFirstRead()
        api.dispatcher = lateFirstRead
        val towns: TownRepository = town(store)

        val older: Deferred<TownReadResult> = async(start = CoroutineStart.UNDISPATCHED) { towns.read() }
        api.takeRequestWithin()
        towns.readSentAfterNow()
        lateFirstRead.answer.countDown()
        older.await()

        assertEquals(NEXT_TOWN_NAME, towns.town.value?.town?.name)
    }

    @Test
    fun `an older read that answers late never replaces the town a lesson start answered`() = runTest {
        val lateFirstRead: LateFirstRead = LateFirstRead()
        api.dispatcher = lateFirstRead
        val towns: TownRepository = town(store)

        val older: Deferred<TownReadResult> = async(start = CoroutineStart.UNDISPATCHED) { towns.read() }
        api.takeRequestWithin()
        towns.startLesson(LessonId("lesson-2"))
        lateFirstRead.answer.countDown()
        older.await()

        assertEquals(NEXT_TOWN_NAME, towns.town.value?.town?.name)
    }

    private fun TestScope.sessions(): SessionRepository = apiRepositories(
        endpoint = slowMachineEndpoint(api.url("/api/").toString()),
        tokenStore = store,
    ).sessions

    private class SessionTowns(private val beforeBearer: String) : Dispatcher() {
        val answer: CountDownLatch = CountDownLatch(1)

        override fun dispatch(request: RecordedRequest): MockResponse {
            if (request.url.encodedPath == SIGN_OUT_PATH) return MockResponse.Builder().code(204).build()
            if (request.headers["Authorization"] != beforeBearer) return json(200, NEXT_TOWN)
            answer.await(ANSWER_WAIT_SECONDS, TimeUnit.SECONDS)
            return json(200, TOWN)
        }
    }

    private class LateFirstRead : Dispatcher() {
        val answer: CountDownLatch = CountDownLatch(1)

        private val isFirstRead: AtomicBoolean = AtomicBoolean(true)

        override fun dispatch(request: RecordedRequest): MockResponse {
            val isLateRead: Boolean = request.method == "GET" && isFirstRead.getAndSet(false)
            if (!isLateRead) return json(200, NEXT_TOWN)
            answer.await(ANSWER_WAIT_SECONDS, TimeUnit.SECONDS)
            return json(200, TOWN)
        }
    }

    private companion object {
        const val TOWN_PATH: String = "/api/town"
        const val NEXT_TOWN_NAME: String = "Maple Falls"
        val NEXT_TOWN: String = TOWN.replace("Riverton", NEXT_TOWN_NAME)
        const val ANSWER_WAIT_SECONDS: Long = 5L
        const val SIGN_OUT_PATH: String = "/api/auth/sign-out"
    }
}

private fun json(code: Int, body: String): MockResponse =
    MockResponse.Builder().code(code).addHeader("Content-Type", "application/json").body(body).build()
