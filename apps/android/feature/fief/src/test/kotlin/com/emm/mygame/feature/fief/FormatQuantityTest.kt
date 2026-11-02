package com.emm.mygame.feature.fief

import org.junit.Assert.assertEquals
import org.junit.Test

class FormatQuantityTest {

    @Test
    fun `groups the thousands of a quantity with a thin space`() {
        assertEquals("1 284", formatQuantity(1_284))
        assertEquals("12 500 000", formatQuantity(12_500_000))
    }

    @Test
    fun `leaves a quantity under a thousand ungrouped`() {
        assertEquals("999", formatQuantity(999))
        assertEquals("0", formatQuantity(0))
    }
}
