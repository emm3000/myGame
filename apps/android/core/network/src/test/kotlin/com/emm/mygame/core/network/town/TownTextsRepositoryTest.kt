package com.emm.mygame.core.network.town

import com.emm.mygame.core.model.learning.FrameSpan
import com.emm.mygame.core.model.learning.TextId
import com.emm.mygame.core.model.learning.WordSupport
import com.emm.mygame.core.model.town.OpenText
import com.emm.mygame.core.model.town.TownTextRepository
import com.emm.mygame.core.model.town.TownTextResult
import com.emm.mygame.core.network.apiRepositories
import com.emm.mygame.core.network.platform.slowMachineEndpoint
import com.emm.mygame.core.network.takeRequestWithin
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runTest
import mockwebserver3.MockResponse
import org.junit.Assert.assertEquals
import org.junit.Test

class TownTextsRepositoryTest : TownRepositoryFixture() {

    @Test
    fun `reads one open text with the support of its spans`() = runTest {
        api.enqueue(json(200, OPEN_TEXT))

        assertEquals(TownTextResult.Read(courseText), texts().readText(TextId("text-1")))
    }

    @Test
    fun `asks for the text by its id`() = runTest {
        api.enqueue(json(200, OPEN_TEXT))

        texts().readText(TextId("text-1"))

        assertEquals("/api/town/texts/text-1", api.takeRequestWithin().url.encodedPath)
    }

    @Test
    fun `answers not open when the api finds no such text for the stage`() = runTest {
        api.enqueue(MockResponse.Builder().code(404).build())

        assertEquals(TownTextResult.NotOpen, texts().readText(TextId("text-9")))
    }

    @Test
    fun `answers no town when the player holds none`() = runTest {
        api.enqueue(json(404, """{"kind":"TownNotFound"}"""))

        assertEquals(TownTextResult.NoTown, texts().readText(TextId("text-1")))
    }

    @Test
    fun `answers unreachable when the text read fails`() = runTest {
        api.enqueue(MockResponse.Builder().code(500).build())

        assertEquals(TownTextResult.Unreachable, texts().readText(TextId("text-1")))
    }

    private val courseText: OpenText = OpenText(
        id = TextId("text-1"),
        title = "A New Course",
        sentences = listOf(
            listOf(
                FrameSpan(text = "I live by the ", support = null),
                FrameSpan(
                    text = "river",
                    support = WordSupport(WordSupport.Shown.Beside, "río", WordSupport.Language.Spanish),
                ),
                FrameSpan(text = ".", support = null),
            ),
        ),
    )

    private fun TestScope.texts(): TownTextRepository = apiRepositories(
        endpoint = slowMachineEndpoint(api.url("/api/").toString()),
        tokenStore = signedIn(),
    ).texts

    private companion object {
        const val OPEN_TEXT: String =
            """{"id":"text-1","title":"A New Course","sentences":[[""" +
                """{"text":"I live by the ","support":null},""" +
                """{"text":"river","support":{"shown":"beside","text":"río","language":"es"}},""" +
                """{"text":".","support":null}]]}"""
    }
}
