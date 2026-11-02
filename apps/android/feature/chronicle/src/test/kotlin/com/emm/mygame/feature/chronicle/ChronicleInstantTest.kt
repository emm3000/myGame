package com.emm.mygame.feature.chronicle

import java.time.LocalDateTime
import java.time.ZoneId
import kotlin.time.Instant
import org.junit.Assert.assertEquals
import org.junit.Test

class ChronicleInstantTest {

    private val madrid: ZoneId = ZoneId.of("Europe/Madrid")

    private val readAt: Instant = Instant.parse("2026-11-02T19:00:00Z")

    @Test
    fun `dates a line of the local day of the read as today`() {
        val line: ChronicleInstant = chronicleInstantOf(Instant.parse("2026-11-01T23:30:00Z"), readAt, madrid)

        assertEquals(ChronicleInstant(ChronicleInstant.Day.Today, LocalDateTime.parse("2026-11-02T00:30")), line)
    }

    @Test
    fun `dates a line before local midnight by its day`() {
        val line: ChronicleInstant = chronicleInstantOf(Instant.parse("2026-11-01T22:30:00Z"), readAt, madrid)

        assertEquals(
            ChronicleInstant(ChronicleInstant.Day.ThisYear, LocalDateTime.parse("2026-11-01T23:30")),
            line,
        )
    }

    @Test
    fun `dates a line of an earlier year with its year`() {
        val line: ChronicleInstant = chronicleInstantOf(Instant.parse("2025-12-31T09:15:00Z"), readAt, madrid)

        assertEquals(
            ChronicleInstant(ChronicleInstant.Day.EarlierYear, LocalDateTime.parse("2025-12-31T10:15")),
            line,
        )
    }
}
