package com.emm.mygame.core.ui

import com.emm.mygame.core.designsystem.MyGameLabel
import java.time.LocalDateTime
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class CopyReaderFormatTest {

    private val midnight: LocalDateTime = LocalDateTime.of(2026, 11, 8, 0, 0)

    private val noon: LocalDateTime = LocalDateTime.of(2026, 11, 8, 12, 0)

    private val morning: LocalDateTime = LocalDateTime.of(2026, 11, 8, 9, 5)

    private val afternoon: LocalDateTime = LocalDateTime.of(2026, 11, 8, 15, 5)

    private fun copyIn(scaffold: ScaffoldLanguage, phase: ChromePhase): PlayerCopy =
        PlayerCopy(RuntimeEnvironment.getApplication(), CopyLanguage(scaffold, phase))

    private val english: PlayerCopy = copyIn(ScaffoldLanguage.None, ChromePhase.Scaffold)

    private val spanish: PlayerCopy = copyIn(ScaffoldLanguage.Spanish, ChromePhase.Scaffold)

    private val both: PlayerCopy = copyIn(ScaffoldLanguage.Spanish, ChromePhase.Both)

    private val englishPhase: PlayerCopy = copyIn(ScaffoldLanguage.Spanish, ChromePhase.English)

    private fun inEnglish(line: CopyReader.() -> String): String = english.fixedCopy(line)

    private fun inSpanish(line: CopyReader.() -> String): String = spanish.fixedCopy(line)

    @Test
    fun `writes midnight as 12 AM on the American clock`() {
        assertEquals("12:00 AM", inEnglish { timeOf(midnight) })
    }

    @Test
    fun `writes noon as 12 PM on the American clock`() {
        assertEquals("12:00 PM", inEnglish { timeOf(noon) })
    }

    @Test
    fun `writes an afternoon hour on the twelve-hour American clock`() {
        assertEquals("3:05 PM", inEnglish { timeOf(afternoon) })
    }

    @Test
    fun `writes a morning hour without a leading zero on the American clock`() {
        assertEquals("9:05 AM", inEnglish { timeOf(morning) })
    }

    @Test
    fun `writes midnight as 00 00 on the Spanish clock`() {
        assertEquals("00:00", inSpanish { timeOf(midnight) })
    }

    @Test
    fun `writes noon as 12 00 on the Spanish clock`() {
        assertEquals("12:00", inSpanish { timeOf(noon) })
    }

    @Test
    fun `writes an afternoon hour on the twenty-four-hour Spanish clock`() {
        assertEquals("15:05", inSpanish { timeOf(afternoon) })
    }

    @Test
    fun `writes a morning hour with two digits on the Spanish clock`() {
        assertEquals("09:05", inSpanish { timeOf(morning) })
    }

    @Test
    fun `writes the day as the month then the day in English`() {
        assertEquals("Nov 8", inEnglish { dayOf(noon) })
    }

    @Test
    fun `writes the day as the day then the lowercase month in Spanish`() {
        assertEquals("8 nov", inSpanish { dayOf(noon) })
    }

    @Test
    fun `lists one item as itself in English`() {
        assertEquals("food", inEnglish { listPhraseOf(listOf("food")) })
    }

    @Test
    fun `joins two items with and in English`() {
        assertEquals("food and power", inEnglish { listPhraseOf(listOf("food", "power")) })
    }

    @Test
    fun `joins three items with a serial comma in English`() {
        assertEquals("food, power, and money", inEnglish { listPhraseOf(listOf("food", "power", "money")) })
    }

    @Test
    fun `lists one item as itself in Spanish`() {
        assertEquals("comida", inSpanish { listPhraseOf(listOf("comida")) })
    }

    @Test
    fun `joins two items with y in Spanish`() {
        assertEquals("comida y energía", inSpanish { listPhraseOf(listOf("comida", "energía")) })
    }

    @Test
    fun `joins three items with no comma before y in Spanish`() {
        assertEquals(
            "comida, energía y dinero",
            inSpanish { listPhraseOf(listOf("comida", "energía", "dinero")) },
        )
    }

    @Test
    fun `writes each line of the both phase on its own language's clock`() {
        assertEquals(
            MyGameLabel(text = "3:05 PM", translation = "15:05"),
            both.chrome { timeOf(afternoon) },
        )
    }

    @Test
    fun `writes each line of the both phase with its own language's day`() {
        assertEquals(MyGameLabel(text = "Nov 8", translation = "8 nov"), both.chrome { dayOf(noon) })
    }

    @Test
    fun `joins each line of the both phase with its own language's list`() {
        assertEquals(
            MyGameLabel(text = "a, b, and c", translation = "a, b y c"),
            both.chrome { listPhraseOf(listOf("a", "b", "c")) },
        )
    }

    @Test
    fun `writes the english phase on the American clock for a Spanish scaffold`() {
        assertEquals(MyGameLabel(text = "12:00 AM", translation = null), englishPhase.chrome { timeOf(midnight) })
    }

    @Test
    fun `keeps the Spanish clock for a fixed line in the english phase`() {
        assertEquals("00:00", englishPhase.fixedCopy { timeOf(midnight) })
    }
}
