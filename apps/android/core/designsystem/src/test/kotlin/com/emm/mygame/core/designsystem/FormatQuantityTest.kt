package com.emm.mygame.core.designsystem

import org.junit.Assert.assertEquals
import org.junit.Test

class FormatQuantityTest {

    @Test
    fun `groups the thousands of a quantity with a space no line breaks at`() {
        assertEquals("1\u202F284", formatQuantity(1_284))
        assertEquals("12\u202F500\u202F000", formatQuantity(12_500_000))
    }

    @Test
    fun `leaves a quantity under a thousand ungrouped`() {
        assertEquals("999", formatQuantity(999))
        assertEquals("0", formatQuantity(0))
    }
}
