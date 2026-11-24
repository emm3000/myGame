package com.emm.mygame.core.network.town.building

import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.building.NeededWordKind
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.network.town.TownRepositoryFixture
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Test

class TownWordsRepositoryTest : TownRepositoryFixture() {

    @Test
    fun `reads the town's stable and retained words`() = runTest {
        api.enqueue(json(200, townWithWords(stable = 14, retained = 3)))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(14 to 3, read.stableWordCount to read.retainedWordCount)
    }

    @Test
    fun `reads a stable need with the stable words as held`() = runTest {
        api.enqueue(json(200, townWithFarmNeed("""{"count":10,"standing":"stable"}""")))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(TownSnapshot.WordsNeeded(10, NeededWordKind.Stable, held = 14), farmOf(read).next?.wordsNeeded)
    }

    @Test
    fun `reads a retained need with the retained words as held`() = runTest {
        api.enqueue(json(200, townWithFarmNeed("""{"count":50,"standing":"retained"}""")))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(TownSnapshot.WordsNeeded(50, NeededWordKind.Retained, held = 3), farmOf(read).next?.wordsNeeded)
    }

    @Test
    fun `reads no need where the api names none`() = runTest {
        api.enqueue(json(200, townWithFarmNeed("null")))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(null, farmOf(read).next?.wordsNeeded)
    }

    @Test
    fun `answers Unreachable for a need of a standing the client does not know`() = runTest {
        api.enqueue(json(200, townWithFarmNeed("""{"count":10,"standing":"proven"}""")))

        assertEquals(TownReadResult.Unreachable, town().read())
    }

    private fun townWithWords(stable: Int, retained: Int): String = TOWN.replace(
        """"stableWordCount":0,"retainedWordCount":0""",
        """"stableWordCount":$stable,"retainedWordCount":$retained""",
    )

    private fun townWithFarmNeed(need: String): String = townWithWords(stable = 14, retained = 3).replace(
        """"farm":$FLAT""",
        """"farm":{"level":2,"nextLevel":{"level":3,"cost":$COST,"durationSeconds":90,"people":1,""" +
            """"wordsNeeded":$need}}""",
    )

    private fun farmOf(town: TownSnapshot): TownSnapshot.Building =
        town.buildings.first { place: TownSnapshot.Building -> place.kind == TownBuildingKind.Farm }

    private companion object {
        const val COST: String = """{"money":60,"food":0,"power":0,"material":30}"""
    }
}
