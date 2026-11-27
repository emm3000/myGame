package com.emm.mygame.buildlogic

import org.junit.Assert.assertEquals
import org.junit.Test

class MapFindingsTest {

    private val settings: String = """
        rootProject.name = "myGame"
        include(":app")
        include(":core:model")
        include(":feature:town")
    """.trimIndent()

    private fun mapListing(vararg modules: String): String =
        "# Map\n\n| Module | Holds |\n|---|---|\n" + modules.joinToString(separator = "") { "| `$it` | what it holds |\n" }

    @Test
    fun `passes a module table that names every module of the settings`() {
        assertEquals(emptyList<String>(), mapFindingsOf(settings, mapListing("app", "core:model", "feature:town")))
    }

    @Test
    fun `flags a module of the settings that the table leaves out`() {
        assertEquals(
            listOf("map-table core:model: included in settings.gradle.kts, absent from the module table of ARCHITECTURE.md"),
            mapFindingsOf(settings, mapListing("app", "feature:town")),
        )
    }

    @Test
    fun `flags a table row that names no module of the settings`() {
        assertEquals(
            listOf("map-table feature:map: a row of the module table of ARCHITECTURE.md, not included in settings.gradle.kts"),
            mapFindingsOf(settings, mapListing("app", "core:model", "feature:map", "feature:town")),
        )
    }

    @Test
    fun `reads a module named in several rows as one`() {
        val map: String = mapListing("app", "core:model", "feature:town") + "\n| `app` | the shell's frame |\n"

        assertEquals(emptyList<String>(), mapFindingsOf(settings, map))
    }

    @Test
    fun `reads only a row whose first cell names a module`() {
        val map: String = mapListing("app", "core:model", "feature:town") +
            "\n| `town` | a feature word |\n| Holds `core:ui` | prose |\nThe arrow `core:network` points left.\n"

        assertEquals(emptyList<String>(), mapFindingsOf(settings, map))
    }
}
