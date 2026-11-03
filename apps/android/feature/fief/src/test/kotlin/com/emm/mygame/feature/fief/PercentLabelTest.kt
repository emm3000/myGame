package com.emm.mygame.feature.fief

import org.junit.Assert.assertEquals
import org.junit.Test

class PercentLabelTest {

    @Test
    fun `draws a fractional rate with a decimal comma`() {
        assertEquals("7,5", percentLabelOf(7.5))
    }

    @Test
    fun `draws a whole rate without a fraction`() {
        assertEquals("5", percentLabelOf(5.0))
    }
}
