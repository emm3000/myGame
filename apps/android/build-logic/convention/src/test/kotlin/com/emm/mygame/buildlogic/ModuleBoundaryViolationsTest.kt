package com.emm.mygame.buildlogic

import org.junit.Assert.assertEquals
import org.junit.Test

class ModuleBoundaryViolationsTest {

    private val boundaries: ModuleBoundaries = ModuleBoundaries(
        coreEdges = mapOf(":core:ui" to emptySet()),
        featureEdges = setOf(":core:ui"),
    )

    private fun violationsOf(module: String, edge: String): List<String> =
        moduleBoundaryViolationsOf(mapOf(module to listOf(edge)), boundaries, emptyList())

    @Test
    fun `flags a feature's production configuration that reads core ui's test fixtures`() {
        assertEquals(
            listOf(
                ":feature:town depends on :core:ui's test fixtures through implementation; " +
                    "only a test configuration may",
            ),
            violationsOf(":feature:town", "implementation=:core:ui(test-fixtures)"),
        )
    }

    @Test
    fun `passes a feature's test configuration that reads core ui's test fixtures`() {
        assertEquals(emptyList<String>(), violationsOf(":feature:town", "testImplementation=:core:ui(test-fixtures)"))
    }
}
