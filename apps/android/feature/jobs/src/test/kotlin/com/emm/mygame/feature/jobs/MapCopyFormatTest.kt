package com.emm.mygame.feature.jobs

import com.emm.mygame.core.designsystem.text.MyGameLabel
import com.emm.mygame.core.ui.ChromePhase
import com.emm.mygame.core.ui.CopyLanguage
import com.emm.mygame.core.ui.CopyReader
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.ScaffoldLanguage
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class MapCopyFormatTest {

    private val english: PlayerCopy = PlayerCopy(
        RuntimeEnvironment.getApplication(),
        CopyLanguage(ScaffoldLanguage.None, ChromePhase.Scaffold),
    )

    private val spanish: PlayerCopy = PlayerCopy(
        RuntimeEnvironment.getApplication(),
        CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Scaffold),
    )

    private fun CopyReader.hiresAtHomeLine(hire: String, count: Int): String =
        text(R.string.map_refusal_not_enough_hires_at_home, "hire" to hire, "count" to count, "atHome" to "0")

    @Test
    fun `picks the one-worker plural in English`() {
        assertEquals(
            "The team needs 1 worker and you have 0 at home.",
            english.fixedCopy { hiresAtHomeLine(hire = "worker", count = 1) },
        )
    }

    @Test
    fun `picks the many-trucks plural without grouping in English`() {
        assertEquals(
            "The team needs 10000 trucks and you have 0 at home.",
            english.fixedCopy { hiresAtHomeLine(hire = "truck", count = 10000) },
        )
    }

    @Test
    fun `picks the one-worker plural in Spanish`() {
        assertEquals(
            "El equipo necesita 1 trabajador y tienes 0 en casa.",
            spanish.fixedCopy { hiresAtHomeLine(hire = "worker", count = 1) },
        )
    }

    @Test
    fun `picks the many-trucks plural without grouping in Spanish`() {
        assertEquals(
            "El equipo necesita 10000 camiones y tienes 0 en casa.",
            spanish.fixedCopy { hiresAtHomeLine(hire = "truck", count = 10000) },
        )
    }

    @Test
    fun `groups a number argument with the American separator in English`() {
        assertEquals(
            "12,000 at home",
            english.fixedCopy { text(R.string.map_job_at_home, "count" to 12000) },
        )
    }

    @Test
    fun `groups a number argument with the Spanish separator in Spanish`() {
        assertEquals(
            "12.000 en casa",
            spanish.fixedCopy { text(R.string.map_job_at_home, "count" to 12000) },
        )
    }

    @Test
    fun `keeps a number passed as text ungrouped in either language`() {
        val inEnglish: String = english.fixedCopy { text(R.string.map_job_at_home, "count" to 12000.toString()) }
        val inSpanish: String = spanish.fixedCopy { text(R.string.map_job_at_home, "count" to 12000.toString()) }

        assertEquals(listOf("12000 at home", "12000 en casa"), listOf(inEnglish, inSpanish))
    }

    @Test
    fun `selects the season in English`() {
        assertEquals(
            "Fall: 80 % of the hours on the way",
            english.fixedCopy { text(R.string.map_season_road_mark, "season" to "fall", "percent" to "80") },
        )
    }

    @Test
    fun `selects the season in Spanish`() {
        assertEquals(
            "Otoño: el camino tarda el 80 % del tiempo",
            spanish.fixedCopy { text(R.string.map_season_road_mark, "season" to "fall", "percent" to "80") },
        )
    }

    @Test
    fun `writes each line of the both phase in its own language`() {
        val both: PlayerCopy = PlayerCopy(
            RuntimeEnvironment.getApplication(),
            CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Both),
        )

        val line: MyGameLabel = both.chrome(R.string.map_job_at_home, "count" to "3")

        assertEquals(MyGameLabel(text = "3 at home", translation = "3 en casa"), line)
    }
}
