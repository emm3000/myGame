package com.emm.mygame.feature.report

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
import java.time.ZoneId
import kotlin.time.Instant

@RunWith(RobolectricTestRunner::class)
class ReportCopyTest {

    private val spanish: PlayerCopy = PlayerCopy(
        RuntimeEnvironment.getApplication(),
        CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Scaffold),
    )

    private fun inSpanish(line: CopyReader.() -> String): String = spanish.fixedCopy(line)

    private val at: Instant = Instant.parse("2026-11-05T14:56:00Z")

    private val lima: ZoneId = ZoneId.of("America/Lima")

    @Test
    fun `gives the next review of the day of the read by its clock`() {
        val readAt: Instant = Instant.parse("2026-11-05T13:00:00Z")

        assertEquals("09:56", inSpanish { nextReviewLabelOf(at, readAt, lima) })
    }

    @Test
    fun `gives the next review of the day after as tomorrow`() {
        val readAt: Instant = Instant.parse("2026-11-04T20:00:00Z")

        assertEquals("mañana 09:56", inSpanish { nextReviewLabelOf(at, readAt, lima) })
    }

    @Test
    fun `gives a later next review with its day`() {
        val readAt: Instant = Instant.parse("2026-11-01T20:00:00Z")

        assertEquals("5 nov 09:56", inSpanish { nextReviewLabelOf(at, readAt, lima) })
    }
}
