package com.emm.mygame.core.network.learning

import com.emm.mygame.core.model.learning.FrameSpan
import com.emm.mygame.core.model.learning.KeepGoingRepository
import com.emm.mygame.core.model.learning.KeepGoingResult
import com.emm.mygame.core.model.learning.KeepGoingWord
import com.emm.mygame.core.model.learning.WordId
import com.emm.mygame.core.model.learning.WordSupport
import com.emm.mygame.core.network.apiRepositories
import com.emm.mygame.core.network.platform.slowMachineEndpoint
import com.emm.mygame.core.network.takeRequestWithin
import com.emm.mygame.core.network.town.TownRepositoryFixture
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runTest
import mockwebserver3.MockResponse
import org.junit.Assert.assertEquals
import org.junit.Test

class KeepGoingRepositoryTest : TownRepositoryFixture() {

    @Test
    fun `reads each word's frames with the support of their spans`() = runTest {
        api.enqueue(json(200, RIVER_FRAMES))

        assertEquals(KeepGoingResult.Read(listOf(riverWord)), frames().readFrames())
    }

    @Test
    fun `asks the town for the frames Keep going offers`() = runTest {
        api.enqueue(json(200, RIVER_FRAMES))

        frames().readFrames()

        assertEquals("/api/town/frames", api.takeRequestWithin().url.encodedPath)
    }

    @Test
    fun `answers no town when the player holds none`() = runTest {
        api.enqueue(json(404, """{"kind":"TownNotFound"}"""))

        assertEquals(KeepGoingResult.NoTown, frames().readFrames())
    }

    @Test
    fun `answers unreachable when the frames read fails`() = runTest {
        api.enqueue(MockResponse.Builder().code(500).build())

        assertEquals(KeepGoingResult.Unreachable, frames().readFrames())
    }

    private val riverWord: KeepGoingWord = KeepGoingWord(
        word = WordId("river"),
        frames = listOf(
            listOf(
                FrameSpan(text = "I live by the ", support = null),
                FrameSpan(
                    text = "river",
                    support = WordSupport(WordSupport.Shown.OnTap, "río", WordSupport.Language.Spanish),
                ),
                FrameSpan(text = ".", support = null),
            ),
        ),
    )

    private fun TestScope.frames(): KeepGoingRepository = apiRepositories(
        endpoint = slowMachineEndpoint(api.url("/api/").toString()),
        tokenStore = signedIn(),
    ).keepGoing

    private companion object {
        const val RIVER_FRAMES: String =
            """{"words":[{"wordId":"river","frames":[[""" +
                """{"text":"I live by the ","support":null},""" +
                """{"text":"river","support":{"shown":"onTap","text":"río","language":"es"}},""" +
                """{"text":".","support":null}]]}]}"""
    }
}
