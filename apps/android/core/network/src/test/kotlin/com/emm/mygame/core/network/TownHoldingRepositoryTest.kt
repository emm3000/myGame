package com.emm.mygame.core.network

import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.town.TownRepository
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.school.RetainedWords
import com.emm.mygame.core.network.platform.TokenStore
import kotlin.time.Duration.Companion.minutes
import kotlinx.coroutines.test.runTest
import mockwebserver3.Dispatcher
import mockwebserver3.MockResponse
import mockwebserver3.RecordedRequest
import org.junit.Assert.assertEquals
import org.junit.Test

class TownHoldingRepositoryTest : TownRepositoryFixture() {

    @Test
    fun `holds no town until an answer names it`() = runTest {
        assertEquals(null, town().town.value)
    }

    @Test
    fun `holds a read with the gap between its instant and the device clock at its arrival`() = runTest {
        val towns: TownRepository = town()
        api.enqueue(json(200, TOWN))

        towns.read()

        assertEquals(1.minutes, towns.town.value?.gap)
    }

    @Test
    fun `keeps the last read's gap through a work answer`() = runTest {
        val towns: TownRepository = town()
        api.enqueue(json(200, TOWN))
        api.enqueue(json(200, TOWN))
        towns.read()
        testScheduler.advanceTimeBy(30.minutes)

        towns.startWork(TownBuildingKind.Farm)

        assertEquals(1.minutes, towns.town.value?.gap)
    }

    @Test
    fun `never holds the town of a session the player signed out of`() = runTest {
        val store: TokenStore = signedIn()
        val towns: TownRepository = town(store)
        api.enqueue(json(200, TOWN))
        api.enqueue(MockResponse.Builder().code(204).build())
        towns.read()

        sessions(store).signOut()

        assertEquals(null, towns.town.value)
    }

    @Test
    fun `never holds the town of a session that ended under the player`() = runTest {
        val towns: TownRepository = town()
        api.enqueue(json(200, TOWN))
        api.enqueue(MockResponse.Builder().code(401).build())
        towns.read()

        towns.read()

        assertEquals(null, towns.town.value)
    }

    @Test
    fun `never holds a read that answers after another player signed in`() = runTest {
        val store: TokenStore = signedIn()
        val towns: TownRepository = town(store)
        api.dispatcher = object : Dispatcher() {
            override fun dispatch(request: RecordedRequest): MockResponse {
                store.write("another-session")
                return json(200, TOWN)
            }
        }

        towns.read()

        assertEquals(null, towns.town.value)
    }

    @Test
    fun `measures the gap of a lesson answer when no read is held`() = runTest {
        val towns: TownRepository = town()
        api.enqueue(json(200, TOWN))

        towns.startLesson(LessonId("lesson-1"))

        assertEquals(1.minutes, towns.town.value?.gap)
    }

    @Test
    fun `holds the retained words the last read answered`() = runTest {
        val towns: TownRepository = town()
        api.enqueue(json(200, TOWN_WITH_RETAINED_WORDS))

        towns.read()

        assertEquals(RetainedWords(count = 3, total = 5), towns.town.value?.town?.learning?.retainedWords)
    }

    @Test
    fun `drops the retained words when a read answers none`() = runTest {
        val towns: TownRepository = town()
        api.enqueue(json(200, TOWN_WITH_RETAINED_WORDS))
        api.enqueue(json(200, TOWN))
        towns.read()

        towns.read()

        assertEquals(null, towns.town.value?.town?.learning?.retainedWords)
    }

    @Test
    fun `drops the retained words when the player holds no town`() = runTest {
        val towns: TownRepository = town()
        api.enqueue(json(200, TOWN_WITH_RETAINED_WORDS))
        api.enqueue(json(404, """{"kind":"TownNotFound"}"""))
        towns.read()

        towns.read()

        assertEquals(null, towns.town.value?.town?.learning?.retainedWords)
    }

    @Test
    fun `keeps the retained words through a failed read`() = runTest {
        val towns: TownRepository = town()
        api.enqueue(json(200, TOWN_WITH_RETAINED_WORDS))
        api.enqueue(json(500, "{}"))
        towns.read()

        towns.read()

        assertEquals(RetainedWords(count = 3, total = 5), towns.town.value?.town?.learning?.retainedWords)
    }

    @Test
    fun `holds the retained words a lesson's answer names`() = runTest {
        val towns: TownRepository = town()
        api.enqueue(json(200, TOWN_WITH_RETAINED_WORDS))

        towns.startLesson(LessonId("lesson-1"))

        assertEquals(RetainedWords(count = 3, total = 5), towns.town.value?.town?.learning?.retainedWords)
    }

    @Test
    fun `holds the retained words a work answer names`() = runTest {
        val towns: TownRepository = town()
        api.enqueue(json(200, TOWN_WITH_RETAINED_WORDS))

        towns.startWork(TownBuildingKind.Farm)

        assertEquals(RetainedWords(count = 3, total = 5), towns.town.value?.town?.learning?.retainedWords)
    }
}
